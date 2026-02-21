// sillage-mobile/src/navigation/types.ts

import { RecommendationResponse } from '../services/recommendationService';

export type RecommendStackParamList = {
  RecommendForm: undefined;
  RecommendationResult: {
    recommendation: RecommendationResponse;
  };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  History: undefined;
  RecommendationResult: {
    recommendation: RecommendationResponse;
  };
};

export type CollectionStackParamList = {
  CollectionMain: undefined;
  AddEditPerfume: { perfumeId?: number } | undefined;
};

export type RootTabParamList = {
  Colección: undefined;
  Recomendador: undefined;
  Comprar: undefined;
  Perfil: undefined;
  Admin?: undefined;
};
