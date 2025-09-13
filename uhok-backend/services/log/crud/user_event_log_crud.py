"""
USER_LOG 테이블 CRUD 함수
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from common.errors import BadRequestException, InternalServerErrorException
from common.logger import get_logger
from common.log_utils import serialize_datetime

from services.log.models.log_model import UserLog

logger = get_logger("user_event_log_crud")

async def create_user_log(db: AsyncSession, log_data: dict) -> UserLog:
    """
    사용자 로그 생성(적재)
    - user_id: MariaDB USERS.USER_ID를 그대로 사용
    - 필수값 및 타입 검증
    - created_at은 DB에서 자동 생성(NOW())
    """
    user_id = log_data.get("user_id")
    if user_id is None:
        raise BadRequestException("user_id가 누락되었습니다.")
    if not isinstance(user_id, int) or user_id < 0:
        raise BadRequestException("user_id는 0 이상의 정수여야 합니다.")
    
    # user_id=0은 익명 사용자를 의미하므로 허용
    if user_id == 0:
        logger.debug("익명 사용자 로그 기록: user_id=0")
    if not log_data.get("event_type"):
        raise BadRequestException("event_type이 누락되었습니다.")

    # created_at이 log_data에 들어가 있으면 반드시 pop!
    log_data = dict(log_data)  # 혹시 BaseModel이면 dict()로 변환
    log_data.pop("created_at", None)  # ← 핵심!

    data = {
        "user_id": log_data["user_id"],
        "event_type": log_data["event_type"],
    }
    if "event_data" in log_data and log_data["event_data"] is not None:
        data["event_data"] = serialize_datetime(log_data["event_data"])
    
    # HTTP 관련 필드들 추가 (null 값도 허용, datetime 직렬화 적용)
    http_fields = ["http_method", "api_url", "request_time", "response_time", "response_code", "client_ip"]
    for field in http_fields:
        if field in log_data:  # null 값도 포함하여 추가
            if field in ["request_time", "response_time"] and log_data[field] is not None:
                data[field] = serialize_datetime(log_data[field])
            else:
                data[field] = log_data[field]

    try:
        log = UserLog(**data)  # created_at 없음!

        db.add(log)
        await db.commit()
        await db.refresh(log)
        # logger.info(f"사용자 로그 생성 성공: user_id={log_data['user_id']}, event_type={log_data['event_type']}")
        return log
    except Exception as e:
        logger.error(f"사용자 로그 생성 실패: {e}")
        raise InternalServerErrorException("로그 저장 중 서버 오류가 발생했습니다.")


async def get_user_logs(db: AsyncSession, user_id: int, limit: int = 50):
    """
    특정 유저의 최근 로그 리스트 조회
    - user_id: MariaDB USERS.USER_ID 기준
    - 최신순, 최대 50개까지 반환
    """
    try:
        result = await db.execute(
            select(UserLog)
            .where(UserLog.user_id == user_id) # type: ignore
            .order_by(UserLog.created_at.desc())
            .limit(limit)
        )
        logs = result.scalars().all()
        # logger.info(f"사용자 로그 조회 성공: user_id={user_id}, count={len(logs)}")
        return logs
    except Exception as e:
        logger.error(f"사용자 로그 조회 실패: user_id={user_id}, error={str(e)}")
        raise InternalServerErrorException("로그 조회 중 서버 오류가 발생했습니다.")
