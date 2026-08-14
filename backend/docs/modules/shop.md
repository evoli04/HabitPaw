# Module: shop

`src/shop/` — the accessory catalog, purchases and which item the cat is wearing. Spends coins through `CoinsService`; never touches the balance directly.

Backs `mobile/src/screens/shop/ShopScreen.js`, which previously kept ownership in `AsyncStorage` and read prices from a client-side constant — meaning the client was the authority on what things cost.

## Files

| File | Role |
|---|---|
| `shop.module.ts` | imports `CoinsModule` |
| `shop-catalog.ts` | the four items + `findCatalogItem(id)` |
| `shop.service.ts` | `listItems`, `purchase`, `setEquipped` |
| `shop.controller.ts` | routes below |
| `dto/shop-item.dto.ts` | `ShopItemDto`, `ShopCatalogResponseDto` |
| `dto/equip.dto.ts` | `EquipItemDto` |

## Routes

| Method | Path | Notes |
|---|---|---|
| `GET` | `/shop/items` | catalog + per-item `owned`/`equipped` + balance |
| `POST` | `/shop/items/:id/purchase` | 200 with refreshed catalog; 400 insufficient balance; 409 already owned; 404 unknown id |
| `PUT` | `/shop/equipped` | body `{ "itemId": "bowtie" }` or `{ "itemId": null }` |

All three return the same `ShopCatalogResponseDto`, so the shop screen re-renders from any of them without a follow-up request.

## Why the catalog is code, not a table

`shop-catalog.ts` holds `id`, `name`, `description`, `price`, `premium`. It deliberately holds **no artwork** — `image` and `previewStyle` stay in `mobile/src/constants/shopItems.js` and are matched to the server payload by `id`.

Adding an item means shipping its image with the app, so a new item requires an app release either way. A database table would only buy price edits without a deploy, at the cost of a seed migration. What actually matters — and what changed — is that the price is now **server-side**.

The mobile constant should keep only `id`, `image` and `previewStyle`; name, description, price and `premium` should come from `GET /shop/items`.

## Purchase atomicity

Ownership row and payment are one transaction, and the ownership row is written **first**:

```ts
await tx.userShopItem.create({ data: { userId, itemId: item.id, pricePaid: item.price } });
const balance = await this.coins.spend(tx, userId, item.price, item.id);
if (balance === null) throw new BadRequestException('…yeterli coinin yok');
```

Writing it first means a duplicate purchase trips `@@unique([userId, itemId])` and rolls back *before* any coins move. Throwing on `balance === null` rolls back the ownership row. There is no ordering where the user ends up charged without the item, or holding an item they did not pay for.

`pricePaid` snapshots the cost at purchase time so a later catalog price change does not rewrite history.

## The single-equipped rule

`setEquipped` clears `equipped` on every row for the user and then sets it on one, inside a transaction. Passing `null` performs only the clear.

This is an application-level invariant, not a schema one: the honest way to state it in the database is a partial unique index (`unique (user_id) where equipped`), which Prisma cannot express without raw SQL in the migration. If the rule ever needs to survive writes from outside this service, add it that way.

Equipping validates two things first — the id exists in the catalog (404) and the caller owns it (400). Buying is not implied by equipping.

## Implementation notes

- **`listItems` is the join point**: catalog is in code, ownership is in the database, balance is in `CoinsService`. It merges the three into one payload rather than making the client stitch them.
- **`premium` is a UI badge only** ("EN ÖZEL" in the app) — it does not gate purchasing. It lives server-side purely so the client does not have to hardcode which item is special.
- **Purchase returns 200, not 201.** The created resource is not addressable on its own; what the caller wants back is the new shop state.

## Known limitations

- **No un-purchase / refund.** Deliberate — there is no product requirement for it, and it would need a rule for what happens to a spent-then-refunded balance.
- **Catalog changes are not versioned.** Renaming an item id would orphan existing `user_shop_items` rows. Treat ids as permanent.
