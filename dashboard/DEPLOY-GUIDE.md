# 중계 서버 배포 가이드 (은아님용)

`fleurien003/naver-blog-helper`를 Render에 올려서, 컴퓨터를 켜두지 않아도
자동화가 네이버 정보를 가져올 수 있게 만드는 순서입니다.

준비물: GitHub 로그인, Render 로그인(이미 가입됨 — 2026-09-17), 네이버 키 5개

---

## 1단계. 브랜치를 main에 합치기 (1분)

1. 아래 주소를 엽니다
   https://github.com/fleurien003/naver-blog-helper/compare/main...claude/secure-keys-and-deploy
2. 초록색 **Create pull request** 버튼 → 다음 화면에서 다시 **Create pull request**
3. **Merge pull request** → **Confirm merge**

합쳐지는 내용
- `main.py`에서 하드코딩된 키 5개 제거 (환경변수로만 받음)
- `/health` 추가
- `render.yaml`, `.gitignore`, `.env.example` 추가
- README 정리

> 번거로우면 "main에 바로 올려줘"라고 말씀만 주세요. 제가 대신 합니다.

---

## 2단계. Render에 배포 (3분)

### 2-1. Blueprint 만들기
1. https://dashboard.render.com 접속
2. 오른쪽 위 **New +** → **Blueprint** 선택
   (Web Service 아님. Blueprint를 골라야 `render.yaml`을 자동으로 읽습니다)
3. GitHub 계정 연결이 안 돼 있으면 **Connect GitHub** → `naver-blog-helper` 저장소만 허용
4. 목록에서 **naver-blog-helper** 선택 → **Connect**
5. `render.yaml`을 찾았다는 화면이 나옵니다. 서비스 이름 `naver-blog-helper` 확인 → **Apply**

### 2-2. 환경 변수 5개 입력
배포가 시작되면 키가 없어서 한 번 실패하거나 `status: missing_env`가 뜹니다. 정상입니다.

왼쪽 메뉴 **Environment** → **Add Environment Variable** 로 아래 5개를 넣습니다.

| Key (이 이름 그대로) | Value 가져오는 곳 |
|---|---|
| `NAVER_SEARCH_ID` | 개발자센터 → 내 애플리케이션 → **Client ID** |
| `NAVER_SEARCH_SECRET` | 같은 화면 → **Client Secret** |
| `AD_API_KEY` | 검색광고 → 도구 → API 사용 관리 → **액세스 라이선스** |
| `AD_SECRET_KEY` | 같은 화면 → **비밀키** |
| `AD_CUSTOMER_ID` | 검색광고 오른쪽 위 **고객 ID** (숫자) |

- 개발자센터: https://developers.naver.com/apps
- 검색광고: https://manage.searchad.naver.com

입력 후 **Save Changes** → 자동으로 다시 배포됩니다 (2~3분)

> 🔑 **키는 새로 발급받은 것을 넣으세요.** 기존 키는 커밋 히스토리에 남아 있습니다.
> 개발자센터에서 Client Secret **재발급**, 검색광고에서 비밀키 **재발급**.

---

## 3단계. 주소 확인해서 알려주기 (1분)

1. Render 서비스 화면 맨 위에 `https://naver-blog-helper-xxxx.onrender.com` 형태의 주소가 있습니다
2. 그 주소 뒤에 `/health`를 붙여서 브라우저로 엽니다
3. 아래처럼 나오면 성공입니다

```json
{
  "status": "ok",
  "env_configured": {
    "NAVER_SEARCH_ID": true,
    "NAVER_SEARCH_SECRET": true,
    "AD_API_KEY": true,
    "AD_SECRET_KEY": true,
    "AD_CUSTOMER_ID": true
  },
  "missing": []
}
```

4. **그 주소를 저에게 알려주세요.**

### 이렇게 나오면
| 화면 | 뜻 | 할 일 |
|---|---|---|
| `"status": "missing_env"` | 키가 덜 들어감 | `missing` 목록의 이름을 Environment에 추가 |
| 30~50초 로딩 후 뜸 | 무료 플랜이 자고 있었음 | 정상입니다. 그대로 두세요 |
| 계속 안 뜸 / 502 | 빌드 실패 | **Logs** 탭 내용을 저에게 보여주세요 |

---

## 4단계. (제 몫) 자동화에 연결

주소를 받으면 제가 합니다.
- 홈피드·체험단 자동화 프롬프트에 `POST /analyze` 호출을 넣습니다
- 📍 주소와 검색량이 자동으로 채워집니다
- keywordsound.com 수동 조회가 필요 없어집니다

### ⚠️ 남은 관문 하나
클라우드 세션의 네트워크 정책이 지금 **깃허브만** 허용하고 있습니다.
`onrender.com`도 막혀 있어서, 배포해도 자동화가 못 부를 수 있습니다.

확인 방법: 주소를 주시면 제가 바로 찔러보고 알려드립니다.
막혀 있으면 환경 설정에서 도메인을 허용해야 합니다.
(환경 설정 문서: https://code.claude.com/docs/en/claude-code-on-the-web)

---

## 이걸로 되는 것 / 안 되는 것

| 항목 | 상태 |
|---|---|
| 📍 주소·도로명주소·업종 | ✅ 자동으로 채워짐 |
| 월 검색량·연관 키워드·경쟁도 | ✅ 자동 |
| 검색어 트렌드·쇼핑 클릭 추이 | ✅ 자동 |
| 참고 블로그 본문 | ✅ 자동 |
| ☎️ 전화번호 | ❌ 지역검색 API가 안 줌 |
| 🕖 영업시간 | ❌ 안 줌 |
| 🚘 주차 | ❌ 안 줌 |

☎️🕖🚘 세 칸은 배포해도 빈칸입니다. 글에서 빼거나 발행 전에 직접 채우셔야 합니다.
