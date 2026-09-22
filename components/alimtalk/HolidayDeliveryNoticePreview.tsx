interface HolidayDeliveryNoticePreviewProps {
  holidayName: string;
  holidayStartDate: string;
  holidayEndDate: string;
  resumeDate: string;
}

export function HolidayDeliveryNoticePreview({
  holidayName,
  holidayStartDate,
  holidayEndDate,
  resumeDate,
}: HolidayDeliveryNoticePreviewProps) {
  return (
    <div className="mx-auto max-w-[320px] rounded-2xl bg-[#B7C9D6] p-3">
      <div className="overflow-hidden rounded-xl bg-white">
        <div className="bg-[#FEE500] px-4 py-3 text-center text-[15px] font-bold tracking-tight text-black">
          배송지연공지
        </div>
        <div className="px-4 pb-4 pt-3.5">
          <p className="text-[13px] text-[#8B95A1]">꼬순박스</p>
          <p className="mt-1 text-[20px] font-bold leading-tight tracking-tight text-black">
            {holidayName} 배송 안내
          </p>
          <div className="my-3 h-px bg-[#EEEEEE]" />
          <div className="space-y-3.5 text-[15px] leading-[1.45] text-black">
            <p>우리 아이를 위한 건강한 맞춤 간식, 꼬순박스입니다.</p>
            <p>
              {holidayName} 기간에는 택배사 사정으로 배송이 잠시 중단됩니다.
            </p>
            <p>
              배송 휴무 기간
              <br />
              {holidayStartDate} ~ {holidayEndDate}
            </p>
            <p>
              휴무 기간에 결제된 상품은 {resumeDate}부터 순차적으로 출고될
              예정이에요. <br />
              배송이 시작되면 바로 알려드릴게요!
            </p>
          </div>
          <p className="mt-4 text-[13px] leading-snug text-[#9AA1A9]">
            채널 추가하고 이 채널의 광고와 마케팅 메시지를 카카오톡으로 받기
          </p>
          <div className="mt-3 flex items-center justify-center gap-1.5 rounded-md bg-[#FEE500] py-3 text-[15px] font-bold text-black">
            <span className="relative inline-flex h-[18px] w-[18px] items-center justify-center">
              <svg
                viewBox="0 0 18 18"
                className="h-[18px] w-[18px]"
                aria-hidden
              >
                <path
                  fill="currentColor"
                  d="M9 1.5C4.86 1.5 1.5 4.3 1.5 7.75c0 2.2 1.46 4.14 3.66 5.22l-.72 2.66c-.07.26.22.47.45.33l3.2-2.05c.3.03.6.04.91.04 4.14 0 7.5-2.8 7.5-6.2S13.14 1.5 9 1.5Z"
                />
              </svg>
              <span className="absolute text-[7px] font-bold leading-none text-[#FEE500]">
                Ch
              </span>
            </span>
            채널추가
          </div>
          <div className="mt-2 rounded-md bg-[#F3F4F5] py-3 text-center text-[15px] font-bold text-black">
            마이페이지 바로가기
          </div>
        </div>
      </div>
    </div>
  );
}
