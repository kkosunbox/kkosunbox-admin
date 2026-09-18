# 어드민 — 구독 플랜 / 단품 썸네일

구독 플랜과 단품 상품 모두 `imageUrl`로 썸네일을 넣고 바꿀 수 있습니다. 이미지는 서버로 직접 올리지 않고, asset 모듈의 presigned URL로 S3에 올린 뒤 `fileUrl`을 플랜/상품 API에 전달합니다.

모든 어드민 API는 `/v1` prefix입니다. 응답 래퍼는 `{ result: boolean, data: T }`입니다. 인증은 관리자 토큰입니다.

단품 주문/재고/배송비는 [ADMIN_PRODUCT_SALES.md](./ADMIN_PRODUCT_SALES.md)를 보세요.

---

## 1. 업로드 흐름 (공통)

허용 확장자: `jpg`, `jpeg`, `png`, `webp`

1. Presigned URL 발급
2. `uploadUrl`로 S3에 PUT (헤더 `Content-Type`은 발급 때 보낸 `fileType`과 같아야 함)
3. 받은 `fileUrl`을 플랜 또는 상품의 `imageUrl`로 저장

```
POST /v1/asset/catalog-image/presigned-url
Authorization: Bearer <admin token>

{ "fileName": "premium-box.jpg", "fileType": "image/jpeg" }
```

응답:

```json
{
  "result": true,
  "data": {
    "uploadUrl": "https://bucket.s3..../catalog-image/{adminId}/{uuid}.jpg?...",
    "fileUrl": "https://bucket.s3..../catalog-image/{adminId}/{uuid}.jpg",
    "fileName": "{uuid}.jpg"
  }
}
```

S3 업로드:

```
PUT {uploadUrl}
Content-Type: image/jpeg
<body: 파일 바이너리>
```

`uploadUrl`은 15분 동안만 유효합니다. 저장할 값은 항상 `fileUrl`입니다. `uploadUrl`을 `imageUrl`에 넣지 마세요.

에러: `INVALID_FILE_FORMAT` — 허용 확장자가 아닐 때.

---

## 2. 단품 상품 썸네일 (`/v1/admin/products`)

등록/수정 모두 `imageUrl`을 받습니다.

```json
POST /v1/admin/products
{
  "name": "프리미엄 패키지 BOX",
  "price": 33900,
  "imageUrl": "https://bucket.s3..../catalog-image/1/{uuid}.jpg",
  "relatedPlanId": 3,
  "stockQuantity": 100
}
```

```json
PATCH /v1/admin/products/:id
{
  "imageUrl": "https://bucket.s3..../catalog-image/1/{uuid}.jpg"
}
```

이 `imageUrl`이 유저 장바구니·이후 신규 주문의 썸네일이 됩니다. 이미 결제된 주문의 `items[].imageUrl`은 주문 시점 스냅샷이라, 상품 썸네일을 바꿔도 과거 주문 이미지는 바뀌지 않습니다.

---

## 3. 구독 플랜 썸네일 (`/v1/admin/plans`)

생성/수정에 `imageUrl`, `slug`가 추가되었습니다.

```json
POST /v1/admin/plans
{
  "name": "프리미엄",
  "slug": "premium",
  "imageUrl": "https://bucket.s3..../catalog-image/1/{uuid}.jpg",
  "monthlyPrice": 33900
}
```

```json
PATCH /v1/admin/plans/:id
{
  "imageUrl": "https://bucket.s3..../catalog-image/1/{uuid}.jpg",
  "slug": "premium"
}
```

| 필드 | 의미 |
| --- | --- |
| `imageUrl` | 유저 구독 주문 카드/상세 썸네일. 결제 시점에 스냅샷됩니다 |
| `slug` | 유저 뱃지 값. `relatedPlanId`가 있는 단품은 이 slug를 보여 줍니다. 예: `basic`, `standard`, `premium` |

플랜 썸네일을 바꿔도 이미 끝난 구독 결제의 스냅샷은 유지됩니다. 스냅샷이 없는 과거 건은 현재 플랜 이미지를 fallback합니다.

---

## 4. 화면 체크리스트

- [ ] 상품 폼: 이미지 선택 → catalog-image presigned → S3 PUT → `imageUrl`에 `fileUrl`
- [ ] 플랜 폼: 동일. `slug`도 함께 편집
- [ ] `imageUrl`에 presigned `uploadUrl`을 저장하지 않기
- [ ] 썸네일 교체 후 유저 상품/플랜 목록에 새 이미지가 보이는지 확인
- [ ] 과거 주문 상세는 이전 스냅샷이 남는 것을 인지
