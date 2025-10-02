from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.api.deps import get_db, get_current_subscribed_user
from app.models.user import User
from app.models.perfume import Perfume, perfume_collection
from app.models.recommendation import Recomendacion
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from app.services.recommendation_engine import generate_recommendation

router = APIRouter()


@router.post("/", response_model=RecommendationResponse)
async def create_recommendation(
    request_data: RecommendationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_subscribed_user)
):
    """Generar una nueva recomendación de perfume"""
    
    # Verificar que el usuario tiene perfumes en su colección
    collection_query = select(Perfume).join(
        perfume_collection,
        and_(
            perfume_collection.c.perfume_id == Perfume.id,
            perfume_collection.c.user_id == current_user.id
        )
    )
    
    result = await db.execute(collection_query)
    user_perfumes = result.scalars().all()
    
    if not user_perfumes:
        raise HTTPException(
            status_code=400,
            detail="Debes tener al menos un perfume en tu colección"
        )
    
    # Generar la recomendación
    recommendation = await generate_recommendation(
        db=db,
        user_id=current_user.id,
        perfumes=user_perfumes,
        **request_data.dict()
    )
    
    # Decrementar consultas restantes
    current_user.consultas_restantes -= 1
    await db.commit()
    
    # Preparar respuesta con info del perfume
    response_dict = {
        "id": recommendation.id,
        "fecha_evento": recommendation.fecha_evento,
        "hora_evento": recommendation.hora_evento,
        "lugar_nombre": recommendation.lugar_nombre,
        "ocasion": recommendation.ocasion,
        "expectativa": recommendation.expectativa,
        "vestimenta": recommendation.vestimenta,
        "clima_descripcion": recommendation.clima_descripcion,
        "temperatura": recommendation.temperatura,
        "humedad": recommendation.humedad,
        "perfume_recomendado_id": recommendation.perfume_recomendado_id,
        "perfume_recomendado": None,
        "explicacion": recommendation.explicacion,
        "respuesta_ia": recommendation.respuesta_ia,
        "created_at": recommendation.created_at
    }
    
    # Si hay perfume recomendado, buscar sus datos
    if recommendation.perfume_recomendado_id:
        perfume_result = await db.execute(
            select(Perfume).where(Perfume.id == recommendation.perfume_recomendado_id)
        )
        perfume = perfume_result.scalar_one_or_none()
        if perfume:
            response_dict["perfume_recomendado"] = {
                "id": perfume.id,
                "nombre": perfume.nombre,
                "marca": perfume.marca,
                "perfumista": perfume.perfumista,
                "notas": perfume.notas,
                "acordes": perfume.acordes
            }
    
    return response_dict


@router.get("/history", response_model=List[RecommendationResponse])
async def get_recommendation_history(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_subscribed_user)
):
    """Obtener historial de recomendaciones del usuario"""
    
    query = select(Recomendacion).where(
        Recomendacion.user_id == current_user.id
    ).order_by(
        Recomendacion.created_at.desc()
    ).limit(limit)
    
    result = await db.execute(query)
    recommendations = result.scalars().all()
    
    # Preparar respuesta con info de perfumes
    response_list = []
    for rec in recommendations:
        rec_dict = {
            "id": rec.id,
            "fecha_evento": rec.fecha_evento,
            "hora_evento": rec.hora_evento,
            "lugar_nombre": rec.lugar_nombre,
            "ocasion": rec.ocasion,
            "expectativa": rec.expectativa,
            "vestimenta": rec.vestimenta,
            "clima_descripcion": rec.clima_descripcion,
            "temperatura": rec.temperatura,
            "humedad": rec.humedad,
            "perfume_recomendado_id": rec.perfume_recomendado_id,
            "perfume_recomendado": None,
            "explicacion": rec.explicacion,
            "respuesta_ia": rec.respuesta_ia,
            "created_at": rec.created_at
        }
        
        if rec.perfume_recomendado_id:
            perfume_result = await db.execute(
                select(Perfume).where(Perfume.id == rec.perfume_recomendado_id)
            )
            perfume = perfume_result.scalar_one_or_none()
            if perfume:
                rec_dict["perfume_recomendado"] = {
                    "id": perfume.id,
                    "nombre": perfume.nombre,
                    "marca": perfume.marca,
                    "perfumista": perfume.perfumista,
                    "notas": perfume.notas,
                    "acordes": perfume.acordes
                }
        
        response_list.append(rec_dict)
    
    return response_list


@router.get("/{recommendation_id}", response_model=RecommendationResponse)
async def get_recommendation(
    recommendation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_subscribed_user)
):
    """Obtener una recomendación específica"""
    
    result = await db.execute(
        select(Recomendacion).where(
            and_(
                Recomendacion.id == recommendation_id,
                Recomendacion.user_id == current_user.id
            )
        )
    )
    
    recommendation = result.scalar_one_or_none()
    
    if not recommendation:
        raise HTTPException(status_code=404, detail="Recomendación no encontrada")
    
    # Preparar respuesta con info del perfume
    response_dict = {
        "id": recommendation.id,
        "fecha_evento": recommendation.fecha_evento,
        "hora_evento": recommendation.hora_evento,
        "lugar_nombre": recommendation.lugar_nombre,
        "ocasion": recommendation.ocasion,
        "expectativa": recommendation.expectativa,
        "vestimenta": recommendation.vestimenta,
        "clima_descripcion": recommendation.clima_descripcion,
        "temperatura": recommendation.temperatura,
        "humedad": recommendation.humedad,
        "perfume_recomendado_id": recommendation.perfume_recomendado_id,
        "perfume_recomendado": None,
        "explicacion": recommendation.explicacion,
        "respuesta_ia": recommendation.respuesta_ia,
        "created_at": recommendation.created_at
    }
    
    if recommendation.perfume_recomendado_id:
        perfume_result = await db.execute(
            select(Perfume).where(Perfume.id == recommendation.perfume_recomendado_id)
        )
        perfume = perfume_result.scalar_one_or_none()
        if perfume:
            response_dict["perfume_recomendado"] = {
                "id": perfume.id,
                "nombre": perfume.nombre,
                "marca": perfume.marca,
                "perfumista": perfume.perfumista,
                "notas": perfume.notas,
                "acordes": perfume.acordes
            }
    
    return response_dict