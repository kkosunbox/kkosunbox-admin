# 어드민 — 주문 라인 / 리뷰 링크 / 부분환불 후 발송

어드민 화면 구현 중에 나온 질문 정리입니다. 단품 판매 본편은 [ADMIN_PRODUCT_SALES.md](./ADMIN_PRODUCT_SALES.md)를 보세요.

모든 어드민 API는 `/v1` prefix입니다.

---

## 1. `itemAmount`와 `allocatedAmount`

상세 화면에는 **단가 · 수량 · 환불수량 · `itemAmount`** 만 그리면 됩니다.

| 필드 | 의미 | 화면 |
| --- | --- | --- |
| `unitPrice` | 주문 시점 단가 | 표시 |
| `quantity` | 주문 수량 | 표시 |
| `itemAmount` | 정가 합계 = 단가 × 수량 (쿠폰 전) | “상품금액” |
| `allocatedAmount` | 쿠폰·100원 내림을 반영한 **실결제 배분액** (배송비 제외) | 표시 안 해도 됨 |
| `refundedQuantity` | 이미 환불된 수량 | 표시 |
| `refundedAmount` | 이미 환불된 금액 (`allocatedAmount` 기준) | 선택 |
| `relatedPlanId` | 연관 구독 플랜 스냅샷 (리뷰 공유용) | 표시 안 해도 됨 |

부분환불 요청은 라인 `id`(`itemId`) + 수량만 보내면 됩니다. 환불 금액은 서버가 `allocatedAmount`로 계산합니다.

---

## 2. 리뷰 → 주문 링크

값이 **이미 있습니다.** 어드민 리뷰 목록/상세는 엔티티를 그대로 내려서 아래 필드가 응답에 들어 있습니다.

| 리뷰 유형 | 링크 필드 | 이동 |
| --- | --- | --- |
| 구독/플랜 리뷰 | `subscriptionPaymentId` | 구독 결제 상세 |
| 독립 상품 리뷰 (`relatedPlanId` 없는 단품) | `productOrderId` | `GET /v1/admin/product-orders/:id` |

`relatedPlanId`가 있는 단품은 플랜 리뷰를 공유합니다. 이 경우 `productOrderId`는 비어 있고, 구독을 한 적이 있으면 `subscriptionPaymentId`가 있을 수 있습니다.

관리자가 직접 만든 리뷰는 둘 다 `null`일 수 있습니다. 값이 있을 때만 링크하면 됩니다.

---

## 3. 부분환불 후 남은 상품 발송 (API 변경)

`PATCH /v1/admin/product-orders/:id/delivery` `{ trackingNumber }`

이제 `status`가 아래 둘 다 허용됩니다.

- `completed`
- `partially_refunded` (배송 전 일부만 취소/환불하고 남은 상품을 보내는 경우)

송장 버튼은 **결제 완료이거나, 부분환불이면서 아직 보낼 상품이 있는 주문**에 열면 됩니다. 전액 `refunded`는 그대로 막혀 있습니다.

한 주문 = 송장 1개입니다. 환불된 라인은 빼 두고 남은 수량만 발송하면 됩니다.

---

## 4. 화면 체크리스트

- [ ] 주문 상세 라인: 상품명, 단가, 수량, `itemAmount`, 환불수량. `allocatedAmount` / `relatedPlanId`는 안 그려도 됨
- [ ] 부분환불: `items[].id` + 수량. 환불액은 서버 계산
- [ ] 독립 상품 리뷰: `productOrderId`가 있으면 단품 주문 상세로 링크
- [ ] 구독/플랜 리뷰: `subscriptionPaymentId`가 있으면 구독 결제 상세로 링크
- [ ] 송장 버튼: `completed` 또는 `partially_refunded`
