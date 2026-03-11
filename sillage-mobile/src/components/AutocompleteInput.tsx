import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface AutocompleteInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelect?: (item: string) => void;
  fetchSuggestions: (query: string) => Promise<string[]>;
  renderSuggestion?: (item: string) => string;
  debounceMs?: number;
  minChars?: number;
  error?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChangeText,
  onSelect,
  fetchSuggestions,
  renderSuggestion,
  debounceMs = 300,
  minChars = 2,
  error,
  keyboardType = 'default',
}) => {
  const { colors } = useTheme();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressRef = useRef(false);

  const handleChangeText = useCallback(
    (text: string) => {
      onChangeText(text);

      if (suppressRef.current) {
        suppressRef.current = false;
        return;
      }

      if (timerRef.current) clearTimeout(timerRef.current);

      if (text.trim().length < minChars) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      timerRef.current = setTimeout(async () => {
        try {
          setLoading(true);
          const results = await fetchSuggestions(text.trim());
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
        } catch {
          setSuggestions([]);
          setShowSuggestions(false);
        } finally {
          setLoading(false);
        }
      }, debounceMs);
    },
    [onChangeText, fetchSuggestions, debounceMs, minChars]
  );

  const handleSelect = useCallback(
    (item: string) => {
      suppressRef.current = true;
      onChangeText(item);
      setSuggestions([]);
      setShowSuggestions(false);
      onSelect?.(item);
    },
    [onChangeText, onSelect]
  );

  return (
    <View>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              borderColor: error ? '#EF4444' : colors.secondary + '90',
              fontFamily: 'Lato-Regular',
            },
          ]}
          value={value}
          onChangeText={handleChangeText}
          keyboardType={keyboardType}
          onBlur={() => {
            setTimeout(() => setShowSuggestions(false), 200);
          }}
        />
        {loading && (
          <ActivityIndicator
            size="small"
            color={colors.accent}
            style={styles.loadingIndicator}
          />
        )}
      </View>
      {error && (
        <Text style={[styles.errorText, { color: '#EF4444', fontFamily: 'Lato-Regular' }]}>
          {error}
        </Text>
      )}
      {showSuggestions && suggestions.length > 0 && (
        <View
          style={[
            styles.suggestionsContainer,
            {
              backgroundColor: colors.bg,
              borderColor: colors.secondary + '60',
            },
          ]}
        >
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => `${item}-${index}`}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            style={styles.suggestionsList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.suggestionItem, { borderBottomColor: colors.secondary + '20' }]}
                onPress={() => handleSelect(item)}
              >
                <Text
                  style={[styles.suggestionText, { color: colors.text, fontFamily: 'Lato-Regular' }]}
                >
                  {renderSuggestion ? renderSuggestion(item) : item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    position: 'relative',
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingRight: 36,
    fontSize: 15,
  },
  loadingIndicator: {
    position: 'absolute',
    right: 12,
    top: 13,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  suggestionsContainer: {
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 4,
    maxHeight: 180,
    overflow: 'hidden',
  },
  suggestionsList: {
    maxHeight: 180,
  },
  suggestionItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
  },
});
