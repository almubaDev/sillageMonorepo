# sillage-backend/app/api/v1/endpoints/recommendations.py

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.perfume import Perfume, perfume_collection
from app.models.recommendation import Recomendacion
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from app.services.recommendation_engine import generate_recommendation

router = APIRouter()


@router.post("/", response_model=RecommendationResponse, status_code=status.HTTP_201_CREATED)
async def create_recommendation(
    request_data: RecommendationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Generar una nueva recomendación de perfume usando IA

    - Requiere consultas disponibles
    - Verifica que el usuario tenga perfumes en su colección
    - Consulta el clima en la ubicación especificada
    - Usa Gemini AI para generar la recomendación
    - Decrementa las consultas restantes
    """

    # Verificar que el usuario tiene consultas disponibles
    if current_user.consultas_restantes <= 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes consultas disponibles. Usa un cupón o adquiere más consultas."
        )
    
    # Verificar que el usuario tiene perfumes en su colección
    collection_query = select(Perfume).join(
        perfume_collection,
        and_(
            perfume_collection.c.perfume_id == Perfume.id,
            perfume_collection.c.user_id == current_user.id,
            perfume_collection.c.removed_at.is_(None)  # Solo perfumes activos
        )
    )
    
    result = await db.execute(collection_query)
    user_perfumes = result.scalars().all()
    
    if not user_perfumes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debes tener al menos un perfume en tu colección para obtener recomendaciones"
        )
    
    try:
        # Generar la recomendación usando el motor de IA
        recommendation = await generate_recommendation(
            db=db,
            user_id=current_user.id,
            perfumes=user_perfumes,
            **request_data.model_dump()
        )
        
        # Decrementar consultas restantes
        if current_user.consultas_restantes > 0:
            current_user.consultas_restantes -= 1
            await db.commit()
        
        # Preparar lista de perfumes enviados para debug
        perfumes_enviados = [
            {
                "nombre": p.nombre,
                "marca": p.marca,
                "acordes": p.acordes or [],
                "notas": p.notas or []
            }
            for p in user_perfumes
        ]

        # Preparar respuesta con información completa
        response_dict = {
            "id": recommendation.id,
            "fecha_evento": recommendation.fecha_evento,
            "hora_evento": recommendation.hora_evento,
            "lugar_nombre": recommendation.lugar_nombre,
            "lugar_descripcion": recommendation.lugar_descripcion,
            "lugar_tipo": recommendation.lugar_tipo,
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
            "created_at": recommendation.created_at,
            "consultas_restantes": current_user.consultas_restantes,
            "perfumes_enviados": perfumes_enviados  # Lista de perfumes enviados a Gemini
        }
        
        # Buscar datos completos del perfume recomendado
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
                    "notas": perfume.notas or [],
                    "acordes": perfume.acordes or []
                }
        
        return response_dict
        
    except Exception as e:
        # Logging del error
        print(f"❌ Error generando recomendación: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al generar la recomendación: {str(e)}"
        )


@router.get("/history", response_model=List[RecommendationResponse])
async def get_recommendation_history(
    limit: int = 10,
    skip: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obtener historial de recomendaciones del usuario"""
    
    query = select(Recomendacion).where(
        Recomendacion.user_id == current_user.id
    ).order_by(
        Recomendacion.created_at.desc()
    ).limit(limit).offset(skip)
    
    result = await db.execute(query)
    recommendations = result.scalars().all()
    
    # Preparar respuesta con perfumes
    response_list = []
    for rec in recommendations:
        rec_dict = {
            "id": rec.id,
            "fecha_evento": rec.fecha_evento,
            "hora_evento": rec.hora_evento,
            "lugar_nombre": rec.lugar_nombre,
            "lugar_descripcion": rec.lugar_descripcion,
            "lugar_tipo": rec.lugar_tipo,
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
                    "notas": perfume.notas or [],
                    "acordes": perfume.acordes or []
                }
        
        response_list.append(rec_dict)
    
    return response_list


@router.get("/{recommendation_id}", response_model=RecommendationResponse)
async def get_recommendation(
    recommendation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recomendación no encontrada"
        )
    
    # Preparar respuesta
    response_dict = {
        "id": recommendation.id,
        "fecha_evento": recommendation.fecha_evento,
        "hora_evento": recommendation.hora_evento,
        "lugar_nombre": recommendation.lugar_nombre,
        "lugar_tipo": recommendation.lugar_tipo,
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
                "notas": perfume.notas or [],
                "acordes": perfume.acordes or []
            }
    
    return response_dict