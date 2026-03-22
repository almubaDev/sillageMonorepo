import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { adminStyles, AdminColors } from './adminStyles';
import api from '../../services/api';

interface ReviewItem {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  user_email: string;
  user_name: string;
}

interface ReviewStats {
  total: number;
  avg_rating: number;
}

export default function ReviewsScreen() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats>({ total: 0, avg_rating: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reviewsRes, statsRes] = await Promise.all([
        api.get('/reviews'),
        api.get('/reviews/stats'),
      ]);
      setReviews(reviewsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <MaterialCommunityIcons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={16}
            color={star <= rating ? '#F59E0B' : AdminColors.gray300}
          />
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[adminStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={AdminColors.primary} />
      </View>
    );
  }

  return (
    <View style={adminStyles.container}>
      <ScrollView
        style={adminStyles.scrollContainer}
        contentContainerStyle={adminStyles.scrollContent}
      >
        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <View style={[adminStyles.statCard, { flex: 1 }]}>
            <Text style={adminStyles.statValue}>{stats.total}</Text>
            <Text style={adminStyles.statLabel}>Total</Text>
          </View>
          <View style={[adminStyles.statCard, { flex: 1 }]}>
            <Text style={[adminStyles.statValue, { color: '#F59E0B' }]}>{stats.avg_rating}</Text>
            <Text style={adminStyles.statLabel}>Promedio</Text>
          </View>
        </View>

        {/* Lista de reviews */}
        {reviews.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <MaterialCommunityIcons name="star-outline" size={48} color={AdminColors.gray300} />
            <Text style={{ color: AdminColors.gray400, marginTop: 12 }}>
              Aún no hay calificaciones
            </Text>
          </View>
        ) : (
          reviews.map((review) => (
            <View
              key={review.id}
              style={[adminStyles.card, { marginBottom: 12 }]}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: AdminColors.gray800 }}>
                    {review.user_name || 'Sin nombre'}
                  </Text>
                  <Text style={{ fontSize: 12, color: AdminColors.gray500 }}>
                    {review.user_email}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: AdminColors.gray400 }}>
                  {new Date(review.created_at).toLocaleDateString('es-CL', {
                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              </View>

              <View style={{ marginBottom: 6 }}>
                {renderStars(review.rating)}
              </View>

              {review.comment ? (
                <Text style={{ fontSize: 13, color: AdminColors.gray700, lineHeight: 20 }}>
                  {review.comment}
                </Text>
              ) : (
                <Text style={{ fontSize: 13, color: AdminColors.gray400, fontStyle: 'italic' }}>
                  Sin comentario
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
