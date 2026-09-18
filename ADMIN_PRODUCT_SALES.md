# 어드민 — 단품 판매 확장 가이드

단품이 “구독의 1회 구매”만이 아니라 독립 상품도 팔 수 있게 바뀌었습니다. 한 주문이 여러 상품을 담고, 재고·배송비·부분환불·독립 상품 리뷰가 추가되었습니다. **구독 주문 화면은 그대로**이고, 이 문서는 단품(`admin/product-orders`, `admin/products`, 설정, 리뷰) 위주입니다.

모든 어드민 API는 `/v1` prefix입니다. 응답 래퍼는 `{ result: boolean, data: T }`입니다.

---

## 1. 한 줄 요약

| 영역 | 할 일 |
| --- | --- |
| 상품 | 재고(`stockQuantity`) 입력. `null`이면 무제한 |
| 상품 | `relatedPlanId` 있으면 구독 리뷰 공유, 없으면 독립 리뷰 |
| 설정 | 배송비 2개 키 UI |
| 단품 주문 | 헤더+라인 구조. 한 결제 = 한 송장 |
| 단품 주문 | 부분환불 (수량 단위) |
| 리뷰 | `productId` 필터. 독립 상품 리뷰는 `planId`가 null |

---

## 2. 상품 관리 (`/v1/admin/products`)

기존 등록/수정에 `stockQuantity`가 추가되었습니다.

```json
POST /v1/admin/products
{
  "name": "단품 A",
  "description": "...",
  "price": 29900,
  "imageUrl": "...",
  "relatedPlanId": null,
  "stockQuantity": 100
}
```

```json
PATCH /v1/admin/products/:id
{
  "stockQuantity": 80,
  "relatedPlanId": null,
  "isSalesPaused": false
}
```

| 필드 | 의미 |
| --- | --- |
| `stockQuantity` | 정수 = 재고 관리. `null` = 무제한. `0` = 품절 (목록 노출, 신규 주문 불가) |
| `relatedPlanId` | 구독 플랜 ID. 설정 시 해당 플랜 리뷰를 공유. 독립 상품이면 `null` |
| `isSalesPaused` | 판매 일시 중단. 목록에는 나오고 신규 주문만 막힘 |
| `isActive` | `false`면 유저 목록에서 사라짐 |
| `price` | 부가세 포함 판매가 |

권장 UI:

- 재고를 “무제한 / 수량 지정” 토글 + 숫자 입력으로 두기
- `null`로 바꾸면 무제한으로 전환됩니다
- 결제 승인 시점에 재고가 차감됩니다. 주문만 만들고 결제 안 한 건은 재고를 붙잡지 않습니다
- 취소/환불된 수량만큼 재고가 복원됩니다
- `relatedPlanId`를 나중에 빼면, **이미 작성된 플랜 리뷰는 그대로**이고 이후 독립 리뷰 경로로 갑니다. 과거 주문의 리뷰 자격은 주문 당시 `relatedPlanId` 스냅샷으로 판정합니다

---

## 3. 배송비 설정 (`/v1/admin/settings`)

마이그레이션 시 아래 키가 없으면 생성됩니다. 없으면 코드 기본값(3,000원 / 50,000원)을 씁니다.

| key | 의미 | 예시 |
| --- | --- | --- |
| `PRODUCT_SHIPPING_FEE` | 단품 기본 배송비 (원) | `"3000"` |
| `PRODUCT_FREE_SHIPPING_THRESHOLD` | 무료배송 기준 금액 (원). **쿠폰 할인 전 상품 정가 합계** 기준. `0`이면 항상 기본 배송비 | `"50000"` |

수정:

```
PATCH /v1/admin/settings/PRODUCT_SHIPPING_FEE
{ "value": "3500" }
```

- **구독 결제에는 적용되지 않습니다.** 단품 주문만입니다.
- 주문에 들어가는 배송비는 결제 시점 값으로 스냅샷됩니다. 설정 변경은 이후 신규 주문부터입니다.
- 부분 취소 후에는 **남은 상품 정가 합계**로 배송비를 다시 계산합니다. 전액 취소면 배송비도 환불됩니다.

설정 화면에서 이 두 키를 배송비 전용 폼으로 빼 주는 것을 권장합니다. 일반 key-value 목록만 있으면 운영자가 찾기 어렵습니다.

---

## 4. 단품 주문 구조 변경 (브레이킹)

`GET /v1/admin/product-orders`, `GET /v1/admin/product-orders/:id` 응답 엔티티가 바뀌었습니다.

**빠진 필드:** `productId`, `productName`, `quantity`  
**이름 변경:** `productName` → `orderName`  
**추가:** `items[]`, `totalQuantity`, `itemsAmount`, `couponDiscountAmount`, `shippingFee`, `refundedAmount`

목록/상세는 주문 헤더 + 라인으로 그리세요.

```
주문(헤더)
  id, orderName, orderId, user, status, display에 쓸 deliveryStatus,
  amount, shippingFee, refundedAmount, couponDiscountAmount,
  trackingNumber, deliveryAddress, approvedAt, cancelledAt
  items[]:
    id, productId, productName, unitPrice, quantity,
    itemAmount, allocatedAmount,
    refundedQuantity, refundedAmount, relatedPlanId
```

- 한 주문 = 한 결제 = **송장 1개**. 상품별로 송장을 쪼개지 않습니다.
- `amount`는 원래 결제액입니다. 환불되어도 줄지 않고 `refundedAmount`가 늘어납니다.
- `status`
  - `completed` — 결제 완료
  - `partially_refunded` — 일부만 환불, 남은 상품은 배송 대상
  - `refunded` — 전액 환불
- 라인의 `id`가 부분환불 때 쓰는 `itemId`입니다.

---

## 5. 배송 처리

기존과 같이 `PATCH /v1/admin/product-orders/:id/delivery` `{ trackingNumber }` → 배송중. 배송완료는 워커가 처리합니다.

**주의:** 현재 배송 처리 API는 `status === "completed"`만 허용합니다. 배송 전에 부분환불을 하면 주문이 `partially_refunded`가 되어 **이 API로 송장 입력이 거절됩니다.**  
운영 가이드: **발송 전에 부분환불하지 말고**, 보내야 할 상품을 확정한 뒤 송장을 넣으세요. 발송 후 부분환불은 아래 강제환불 API를 쓰면 됩니다.

---

## 6. 취소 / 환불

### 배송 전 취소

`POST /v1/admin/product-orders/:id/cancel`

유저 취소와 같은 제약(배송 시작 전)입니다.

```json
{} 
```

또는

```json
{
  "items": [{ "itemId": 101, "quantity": 1 }],
  "cancelReason": "고객 요청"
}
```

`items` 생략 = 남은 전량 + 배송비 환불. 쿠폰 사용 로그가 삭제되어 재사용 가능합니다.

### 강제 환불 (배송중/완료 포함)

`POST /v1/admin/product-orders/:id/refund`

```json
{
  "items": [{ "itemId": 101, "quantity": 1 }],
  "refundReason": "파손"
}
```

`items` 생략 시 남은 전량 환불입니다. 환불된 수량만큼 재고가 복원됩니다.

권장 UI:

- 주문 상세에서 라인별 수량 입력 + “선택 수량 환불”
- 남은 수량(`quantity - refundedQuantity`)보다 많이 넣지 못하게
- 전액 환불 버튼은 `items` 없이 호출

부분환불 후 남은 금액이 무료배송 기준 밑으로 떨어지면, 새로 붙는 배송비만큼 고객 환불액이 줄어듭니다. 환불액이 0원 이하가 되면 API가 거부합니다.

```
PAYMENT_CANCELLATION_NOT_ALLOWED
부분 취소 후 발생하는 배송비가 취소 금액보다 크거나 같습니다. 전액 취소를 이용해주세요.
```

이 경우 전액 환불만 가능하다고 안내하면 됩니다.

---

## 7. 리뷰 (`/v1/admin/reviews`)

목록에 `productId` 쿼리가 추가되었습니다.

```
GET /v1/admin/reviews?page=1&limit=20&planId=&productId=&isHidden=
```

| 리뷰 유형 | `planId` | `productId` |
| --- | --- | --- |
| 구독 플랜 리뷰 (연관 단품 공유 포함) | 있음 | `null` |
| 독립 상품 리뷰 | `null` | 있음 |

숨김/해제(`PATCH .../hide`, `/unhide`)는 기존과 같습니다. 목록 테이블에 대상 컬럼(플랜명 or 상품명)을 나눠 보여 주세요. `plan` / `product` relation이 같이 내려옵니다.

---

## 8. 대시보드 / 캘린더

단품 매출·배송 집계는 **주문 헤더** 기준입니다. 장바구니로 3개를 한 번에 사면 주문 1건입니다. 라벨은 `orderName` (`상품A 외 2건` 형태)입니다.

`partially_refunded`도 결제 완료로 집계에 포함됩니다. 전액 `refunded`는 기존처럼 제외됩니다.

---

## 9. 화면 체크리스트

- [ ] 상품 폼: 재고 무제한/수량, `relatedPlanId` (독립 상품이면 비움)
- [ ] 상품 목록: 재고 수량, 품절(`0`), 무제한(`null`) 표시
- [ ] 설정: `PRODUCT_SHIPPING_FEE`, `PRODUCT_FREE_SHIPPING_THRESHOLD` 편집 UI
- [ ] 단품 주문 목록/상세: `orderName` + `items[]` (상품명·수량·환불수량)
- [ ] 송장 입력은 주문 단위 1개. 배송 전 부분환불 후 송장 입력이 막히는 것 인지
- [ ] 라인 단위 부분환불 + 전액환불
- [ ] 리뷰 목록: 플랜/상품 구분, `productId` 필터

---

## 10. 운영 메모

- 기존 단품 주문은 마이그레이션으로 아이템 1줄씩 백필됩니다. 과거 주문의 배송비는 `0`입니다.
- 결제 승인 중 재고가 없으면 토스 결제가 자동 취소되고 텔레그램 알림이 갑니다.
- 유저도 배송 전이면 부분취소를 직접 할 수 있습니다. 어드민만의 기능이 아닙니다.
