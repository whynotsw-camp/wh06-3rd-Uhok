### Git 커밋 메시지 스타일 가이드

| feat: | 새로운 기능 추가 |
| --- | --- |
| fix: | 버그 수정 |
| docs: | 문서 수정 |
| chore: | 자잘한 수정이나 빌드 업데이트 |
| refactor: | 리팩토링 |
| rename: | 파일 혹은 폴더명을 수정만 한 경우 |
| remove: | 파일을 삭제만 한 경우 |
| test: | 테스트 코드 |
| style: | 코드 스타일 변경 |
| design: | 사용자 UI 디자인 변경 |
| build: | 빌드 파일 수정 |
| ci: | CI 설정 파일 수정 |
| pref: | 성능 개선 |

### 예시

`git commit -m "feat: 로그인 기능 추가"`

---

## git 커밋 메시지 한글 깨짐 오류 해결방법

### ✅ 1. Git 인코딩 설정 변경 (권장)

터미널에서 다음 명령어를 실행하세요:

```bash
git config --global i18n.commitEncoding utf-8
git config --global i18n.logOutputEncoding utf-8
```

이 설정은 Git이 **커밋 메시지와 로그를 UTF-8로 인코딩/디코딩**하도록 지정합니다.

