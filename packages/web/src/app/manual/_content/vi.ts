import type { ManualContent } from './types';

export const viContent: ManualContent = {
  locale: 'vi',
  title: 'Hướng dẫn sử dụng',
  subtitle: 'Hướng dẫn đầy đủ về cách sử dụng ứng dụng Session Translation',
  lastUpdated: '2025-01',
  tableOfContentsTitle: 'Mục lục',
  sections: [
    {
      id: 'login',
      title: '1. Đăng nhập',
      description: 'Bắt đầu bằng cách đăng nhập với tài khoản Google của bạn',
      content: [
        'Trước khi sử dụng ứng dụng, bạn cần đăng nhập bằng tài khoản Google. Điều này cho phép bạn tạo session, quản lý context set và truy cập lịch sử session.',
        'Nhấp vào nút "Sign In" ở góc trên bên phải của trang chủ. Bạn sẽ được chuyển hướng đến trang xác thực của Google, nơi bạn có thể chọn tài khoản.',
        'Sau khi xác thực thành công, bạn sẽ được chuyển hướng trở lại ứng dụng và có thể bắt đầu sử dụng tất cả các tính năng.',
      ],
      image: {
        src: '/manual/01-login.png',
        alt: 'Màn hình đăng nhập với nút Sign In',
      },
      tips: [
        'Ở phiên bản MVP hiện tại, hệ thống giới hạn chỉ sử dụng trong nội bộ Sun*, vì vậy bạn cần đăng nhập bằng tài khoản Sun*.',
        'Lịch sử session và context set được liên kết với tài khoản của bạn',
      ],
    },
    {
      id: 'main-screen',
      title: '2. Tổng quan màn hình chính',
      description: 'Tìm hiểu về trang chủ và các tính năng chính',
      content: [
        'Sau khi đăng nhập, bạn sẽ thấy màn hình chính với các hành động chính sau:',
      ],
      image: {
        src: '/manual/02-main-screen.png',
        alt: 'Màn hình chính với các nút hành động',
      },
      subsections: [
        {
          id: 'main-actions',
          title: 'Các hành động chính',
          content: [
            '**Create Session**: Bắt đầu một session dịch thuật mới với tư cách host. Bạn có thể cấu hình cặp ngôn ngữ, chế độ dịch và mời người tham gia.',
            '**Join Session**: Nhập session code để tham gia cuộc họp hiện có với tư cách người tham gia.',
            '**View My Sessions**: Truy cập dashboard để xem tất cả các session bạn đã tạo hoặc tham gia.',
            '**Manage Context Sets**: Tạo và quản lý từ điển thuật ngữ để cải thiện độ chính xác của bản dịch.',
          ],
        },
      ],
    },
    {
      id: 'context-management',
      title: '3. Quản lý Context',
      description: 'Tạo và quản lý context set để có bản dịch chính xác',
      content: [
        'Context set là tập hợp các thuật ngữ chuyên ngành, tên riêng và ánh xạ dịch thuật giúp AI nhận dạng và dịch từ vựng chuyên biệt một cách chính xác.',
      ],
      subsections: [
        {
          id: 'what-is-context',
          title: '3.1 Context Set là gì?',
          content: [
            'Context set chứa thuật ngữ và thông tin nền tảng đặc thù cho cuộc họp của bạn. Khi họp với khách hàng mới hoặc thảo luận về dự án mới, AI có thể không nhận dạng chính xác tên công ty, tên sản phẩm hoặc thuật ngữ kỹ thuật.',
            'Bằng cách tạo context set, bạn cung cấp cho AI kiến thức chuyên biệt này, giúp nhận dạng giọng nói và dịch thuật chính xác hơn.',
          ],
          tips: [
            'Tạo context set riêng cho từng khách hàng hoặc dự án',
            'Bao gồm tên công ty, tên sản phẩm và thuật ngữ kỹ thuật',
            'Thêm ánh xạ dịch thuật cho các thuật ngữ cần bản dịch cụ thể',
          ],
        },
        {
          id: 'access-context',
          title: '3.2 Truy cập quản lý Context',
          content: [
            'Nhấp vào "Manage Context Sets" trên trang chủ hoặc điều hướng trực tiếp đến trang Contexts.',
            'Bạn sẽ thấy hai phần: context set cá nhân của bạn và context set công khai mà người dùng khác đã chia sẻ.',
          ],
          image: {
            src: '/manual/03-context-list.png',
            alt: 'Trang quản lý context hiển thị danh sách các context set',
          },
        },
        {
          id: 'create-context',
          title: '3.3 Tạo Context Set mới',
          content: [
            'Nhấp vào nút "Create New" để mở biểu mẫu tạo context set.',
            'Điền vào các trường sau:',
            '**Name**: Tên mô tả cho context set (ví dụ: "Dự án ClientX - JA-VI")',
            '**Description**: Giải thích ngắn gọn về nội dung context set',
            '**Terms**: Từ khóa chuyên ngành, tên riêng và thuật ngữ kỹ thuật',
            '**Translation Terms**: Ánh xạ giữa các thuật ngữ ngôn ngữ nguồn và đích',
            '**Text**: Thông tin nền tảng và context bổ sung',
          ],
          image: {
            src: '/manual/04-context-create.png',
            alt: 'Biểu mẫu tạo context set',
          },
        },
        {
          id: 'chatgpt-prompt',
          title: '3.4 Sử dụng ChatGPT để tạo Context (Khuyến nghị)',
          content: [
            'Cách dễ nhất để tạo context set toàn diện là sử dụng tính năng ChatGPT Prompt có sẵn:',
            '1. Nhấp vào nút "ChatGPT Prompt" trong biểu mẫu tạo context',
            '2. Chọn ngôn ngữ nguồn và ngôn ngữ đích cho cuộc họp của bạn',
            '3. Sao chép prompt đã tạo vào clipboard',
            '4. Mở ChatGPT và dán prompt',
            '5. Dán tài liệu dự án, tài liệu cuộc họp hoặc thông tin công ty vào ChatGPT',
            '6. ChatGPT sẽ phân tích nội dung và tạo JSON với các thuật ngữ được trích xuất',
            '7. Sao chép đầu ra JSON từ ChatGPT',
            '8. Quay lại ứng dụng và sử dụng tính năng Import để dán JSON',
          ],
          image: {
            src: '/manual/05-context-chatgpt.png',
            alt: 'Hộp thoại ChatGPT prompt với lựa chọn ngôn ngữ',
          },
          note: 'Phương pháp này tự động trích xuất tên riêng, thuật ngữ kỹ thuật và tạo ánh xạ dịch thuật phù hợp.',
        },
        {
          id: 'import-export',
          title: '3.5 Import và Export',
          content: [
            '**Import**: Bạn có thể nhập context set từ tệp JSON. Sử dụng tab Import trong biểu mẫu tạo để dán hoặc tải lên dữ liệu JSON.',
            '**Export**: Xuất context set hiện có sang JSON để sao lưu hoặc chia sẻ với đồng nghiệp.',
          ],
        },
        {
          id: 'context-best-practices',
          title: '3.6 Các phương pháp tốt nhất',
          content: [
            'Làm theo các khuyến nghị sau để có kết quả tốt nhất:',
          ],
          tips: [
            'Tạo context set riêng cho từng cặp ngôn ngữ (ví dụ: một cho JA-VI, một cho EN-VI)',
            'Sử dụng quy ước đặt tên rõ ràng: "[Khách hàng/Dự án] - [Cặp ngôn ngữ]"',
            'Cập nhật context set khi có thuật ngữ mới được giới thiệu',
            'Giữ thuật ngữ ngắn gọn - ưu tiên 1-2 từ hơn là các cụm từ dài',
            'Bao gồm cả thuật ngữ gốc và các biến thể phổ biến',
          ],
        },
      ],
    },
    {
      id: 'create-session',
      title: '4. Tạo Session',
      description: 'Thiết lập session dịch thuật mới với chế độ và tùy chọn phù hợp',
      content: [
        'Sau khi chuẩn bị context set, bạn có thể tạo session dịch thuật. Chọn chế độ dịch và các tùy chọn phù hợp nhất với nhu cầu cuộc họp của bạn.',
      ],
      image: {
        src: '/manual/06-session-create.png',
        alt: 'Biểu mẫu tạo session',
      },
      subsections: [
        {
          id: 'one-way-mode',
          title: '4.1 Chế độ dịch một chiều (One-Way)',
          content: [
            'Trong chế độ một chiều, tất cả lời nói đều được dịch sang một ngôn ngữ đích duy nhất.',
            '**Phù hợp cho**: Cuộc họp mà người tham gia nói nhiều ngôn ngữ nhưng mọi người đều muốn đọc bản dịch bằng một ngôn ngữ chung.',
            '**Ví dụ**: Đội của bạn muốn tất cả nội dung được dịch sang tiếng Việt, bất kể người nói đang sử dụng tiếng Nhật, tiếng Anh hay tiếng Việt.',
            'Chỉ cần chọn ngôn ngữ đích và tất cả lời nói được nhận dạng sẽ được dịch sang ngôn ngữ đó.',
          ],
        },
        {
          id: 'two-way-mode',
          title: '4.2 Chế độ dịch hai chiều (Two-Way)',
          content: [
            'Trong chế độ hai chiều, hệ thống phát hiện ngôn ngữ nào trong hai ngôn ngữ đang được nói và dịch sang ngôn ngữ còn lại.',
            '**Phù hợp cho**: Cuộc họp song phương với đúng hai ngôn ngữ, nơi cả hai bên đều muốn xem bản dịch bằng ngôn ngữ mẹ đẻ của họ.',
            '**Ví dụ**: Cuộc họp Nhật-Việt, nơi người tham gia Nhật Bản thấy lời nói tiếng Việt được dịch sang tiếng Nhật, và người tham gia Việt Nam thấy lời nói tiếng Nhật được dịch sang tiếng Việt.',
            'Chọn Language A và Language B. Hệ thống sẽ tự động phát hiện và dịch giữa hai ngôn ngữ.',
          ],
        },
        {
          id: 'session-options',
          title: '4.3 Tùy chọn Session',
          content: [
            '**Speaker Diarization (Phân biệt người nói)**: Bật tính năng này để nhận dạng các người nói khác nhau (Speaker 1, Speaker 2, v.v.). Hữu ích cho cuộc họp có nhiều người tham gia để theo dõi ai đã nói gì.',
            '**Chọn Context**: Đính kèm một hoặc nhiều context set để cải thiện độ chính xác nhận dạng cho các thuật ngữ chuyên ngành.',
          ],
          image: {
            src: '/manual/07-session-options.png',
            alt: 'Tùy chọn session bao gồm speaker diarization và chọn context',
          },
        },
        {
          id: 'select-context',
          title: '4.4 Chọn Context Set',
          content: [
            'Khi tạo session, bạn có thể đính kèm các context set để cải thiện độ chính xác của phiên âm và dịch thuật.',
            'Trong phần "Context Sets" của form tạo session, nhấp "Add Context" để duyệt và chọn từ các context set cá nhân và công khai.',
            'Bạn có thể thêm nhiều context set cho một session. Hệ thống sẽ gộp tất cả các thuật ngữ và ánh xạ dịch từ các set đã chọn.',
            'Nếu bạn chưa tạo context set nào, hãy xem mục 3 (Quản lý Context) để biết cách tạo trước khi bắt đầu session.',
          ],
          tips: [
            'Chọn context set phù hợp với chủ đề cuộc họp và cặp ngôn ngữ',
            'Bạn cũng có thể thêm hoặc xóa context set sau khi session đã bắt đầu từ bảng điều khiển session',
          ],
        },
        {
          id: 'invite-participants',
          title: '4.5 Mời người tham gia',
          content: [
            'Bạn có thể mời người khác tham gia session:',
            '**Qua Email**: Nhập địa chỉ email để gửi lời mời. Người được mời sẽ nhận được thông báo.',
            '**Qua Session Code**: Chia sẻ trực tiếp session code 6 chữ số. Bất kỳ ai có mã đều có thể tham gia qua trang Join Session.',
          ],
          tips: [
            'Session code không phân biệt chữ hoa chữ thường',
            'Người tham gia được mời có thể xem bản ghi và bản dịch trực tiếp',
          ],
        },
      ],
    },
    {
      id: 'in-meeting',
      title: '5. Trong cuộc họp',
      description: 'Cách sử dụng các tính năng dịch thuật trong cuộc họp',
      content: [
        'Sau khi session bắt đầu, bạn sẽ thấy giao diện phiên âm và dịch thuật thời gian thực.',
      ],
      image: {
        src: '/manual/08-in-meeting.png',
        alt: 'Giao diện phiên âm trong cuộc họp',
      },
      note: 'QUAN TRỌNG: Để có kết quả tốt nhất, chỉ CẦN MỘT NGƯỜI tham gia session và bật microphone. Sử dụng loa ngoài để microphone có thể thu tất cả âm thanh cuộc họp bao gồm cả người tham gia từ xa.',
      subsections: [
        {
          id: 'audio-setup',
          title: '5.1 Thiết lập âm thanh (Loa ngoài)',
          content: [
            'Thiết lập khuyến nghị để thu âm thanh cuộc họp khi sử dụng loa ngoài:',
            '1. Chỉ định một người (thường là host) tham gia session với microphone được bật',
            '2. Sử dụng loa ngoài với âm lượng phù hợp',
            '3. Microphone sẽ thu tất cả âm thanh từ phòng họp bao gồm cả người tham gia cuộc họp trực tuyến',
            '4. Những người tham dự khác có thể xem bản dịch trên thiết bị của họ mà không cần tham gia với tư cách người nói',
          ],
          tips: [
            'Đặt microphone ở vị trí trung tâm phòng họp',
            'Tránh nhiều người tham gia với microphone được bật - điều này có thể gây ra tiếng vọng và bản ghi trùng lặp',
            'Kiểm tra mức âm thanh trước khi cuộc họp bắt đầu',
          ],
        },
        {
          id: 'chrome-tab-audio',
          title: '5.2 Chế độ Chrome Tab (Họp từ xa với tai nghe)',
          content: [
            'Khi bạn họp trực tuyến và sử dụng tai nghe, âm thanh từ cuộc họp không phát ra loa ngoài nên microphone không thể thu được. Tính năng Tab Audio giúp giải quyết vấn đề này.',
            'Cách hoạt động:',
            '1. Nhấp vào nút "Record from Browser Tab" trong phần Tab Audio',
            '2. Trình duyệt sẽ hiển thị cửa sổ chọn tab - chọn tab chứa cuộc họp (Google Meet, Teams, v.v.)',
            '3. QUAN TRỌNG: Đánh dấu checkbox "Share audio" (Chia sẻ âm thanh) trước khi nhấn Share',
            '4. Hệ thống sẽ tự động thu ĐỒNG THỜI cả âm thanh từ microphone của bạn VÀ âm thanh từ browser tab',
            'Khi sử dụng chế độ này, bạn có thể đeo tai nghe để nghe cuộc họp trong khi hệ thống vẫn capture được cả tiếng nói của bạn và tiếng nói của người khác trong cuộc họp.',
          ],
          tips: [
            'Tính năng này chỉ hoạt động trên Chrome và Edge, không hỗ trợ Firefox và Safari',
            'Đặc biệt hữu ích cho họp từ xa khi sử dụng tai nghe - không cần mở loa ngoài',
            'Bạn vẫn có thể nói bình thường - microphone sẽ thu âm thanh của bạn',
            'Nhấp "Remove" để ngắt kết nối Chrome tab và quay lại chế độ chỉ microphone',
          ],
          note: 'LƯU Ý: Khi chọn tab để chia sẻ, hãy đảm bảo đã bật "Share audio" để hệ thống có thể thu âm thanh từ tab.',
        },
        {
          id: 'transcription-view',
          title: '5.3 Hiểu giao diện hiển thị',
          content: [
            'Giao diện cuộc họp hiển thị:',
            '**Lời nói gốc**: Nội dung được nhận dạng từ âm thanh',
            '**Bản dịch**: Văn bản đã được dịch sang ngôn ngữ đích của bạn',
            '**Nhãn người nói**: Nếu speaker diarization được bật, người nói sẽ được gắn nhãn (Speaker 1, Speaker 2, v.v.)',
            'Văn bản xuất hiện theo thời gian thực khi lời nói được nhận dạng. Văn bản ban đầu có thể cập nhật khi AI tinh chỉnh nhận dạng.',
          ],
        },
        {
          id: 'recording-cost',
          title: '5.4 Lưu ý quan trọng: Chi phí Recording',
          content: [
            'Khi bạn nhấn "Start Recording", hệ thống sẽ mở một kết nối đến dịch vụ AI. Kết nối này phát sinh chi phí trong suốt thời gian hoạt động, kể cả khi không có ai nói.',
            'Để tránh phát sinh chi phí không cần thiết:',
            '1. Nhấn "Stop Recording" khi không sử dụng tính năng phiên âm',
            '2. Nhấn "End Session" khi cuộc họp kết thúc',
          ],
          note: 'LƯU Ý VỀ CHI PHÍ: Dịch vụ AI tính phí dựa trên thời gian kết nối, không phải thời gian nói. Hãy luôn stop recording hoặc end session khi không sử dụng.',
        },
      ],
    },
    {
      id: 'other-features',
      title: '6. Các tính năng khác',
      description: 'Chức năng bổ sung để quản lý session',
      subsections: [
        {
          id: 'end-session',
          title: '6.1 Kết thúc Session',
          content: [
            'Nhấp vào nút "End Session" để dừng phiên âm và lưu session.',
            'Bản ghi hoàn chỉnh với bản dịch sẽ được lưu và có thể truy cập từ lịch sử session của bạn.',
          ],
        },
        {
          id: 'display-view',
          title: '6.2 Chế độ hiển thị (Display View)',
          content: [
            'Sử dụng Display View để chia sẻ bản dịch trên màn hình lớn:',
            '1. Mở session và nhấp "Display View" hoặc điều hướng đến /session/[code]/display',
            '2. Chế độ này cung cấp giao diện chỉ đọc, được tối ưu hóa cho máy chiếu hoặc màn hình lớn',
            '3. Chia sẻ màn hình này để mọi người trong phòng họp có thể xem bản dịch trực tiếp',
          ],
          image: {
            src: '/manual/09-display-view.png',
            alt: 'Display View để chia sẻ trên màn hình lớn',
          },
          tips: [
            'Sử dụng chế độ toàn màn hình (F11) để có trải nghiệm xem tốt nhất',
            'Điều chỉnh zoom của trình duyệt để dễ đọc từ xa',
          ],
        },
        {
          id: 'history',
          title: '6.3 Lịch sử Session',
          content: [
            'Truy cập các session trước từ Dashboard:',
            '1. Nhấp "View My Sessions" trên trang chủ',
            '2. Tìm session bạn muốn xem lại',
            '3. Nhấp để mở bản ghi đầy đủ với lời nói gốc và bản dịch',
            'Bạn có thể xem lại các cuộc họp trước, tìm kiếm nội dung cụ thể và chia sẻ bản ghi nếu cần.',
          ],
          image: {
            src: '/manual/10-history.png',
            alt: 'Lịch sử session hiển thị các cuộc họp trước',
          },
        },
      ],
    },
  ],
  footer: {
    helpText: 'Cần thêm trợ giúp? Liên hệ qua Slack channel',
    channelName: '#con_sun-meeting-support_int',
  },
};
