from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.permissions import require_admin
from app.api.deps import get_current_user
from app.models.user import User
from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewResponse

router = APIRouter()


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = Review(
        user_id=current_user.id,
        rating=data.rating,
        comment=data.comment.strip(),
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return ReviewResponse(
        id=review.id,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at,
        user_email=current_user.email,
        user_name=f"{current_user.first_name} {current_user.last_name}".strip(),
    )


@router.get("", response_model=List[ReviewResponse])
async def list_reviews(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    result = await db.execute(
        select(Review).options(selectinload(Review.user)).order_by(Review.created_at.desc())
    )
    reviews = result.scalars().all()
    return [
        ReviewResponse(
            id=r.id,
            rating=r.rating,
            comment=r.comment,
            created_at=r.created_at,
            user_email=r.user.email,
            user_name=f"{r.user.first_name} {r.user.last_name}".strip(),
        )
        for r in reviews
    ]


@router.get("/stats")
async def review_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    result = await db.execute(
        select(func.count(Review.id), func.avg(Review.rating))
    )
    row = result.one()
    return {
        "total": row[0] or 0,
        "avg_rating": round(float(row[1]), 1) if row[1] else 0,
    }


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review no encontrada")
    await db.delete(review)
    await db.commit()
