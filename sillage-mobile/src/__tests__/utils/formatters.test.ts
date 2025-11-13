import { formatPerfumeName, formatBrand, formatPerfumista } from '../../utils/formatters';

describe('formatters', () => {
  describe('formatPerfumeName', () => {
    it('should format name with hyphens to spaces and capitalize', () => {
      expect(formatPerfumeName('erba-pura')).toBe('Erba Pura');
      expect(formatPerfumeName('aventus-for-her')).toBe('Aventus For Her');
      expect(formatPerfumeName('acqua-di-gio')).toBe('Acqua Di Gio');
    });

    it('should handle single word names', () => {
      expect(formatPerfumeName('sauvage')).toBe('Sauvage');
      expect(formatPerfumeName('ALLURE')).toBe('Allure');
    });

    it('should handle empty string', () => {
      expect(formatPerfumeName('')).toBe('');
    });

    it('should handle names already in correct format', () => {
      expect(formatPerfumeName('Dior-Sauvage')).toBe('Dior Sauvage');
      expect(formatPerfumeName('LA-VIE-EST-BELLE')).toBe('La Vie Est Belle');
    });

    it('should handle mixed case', () => {
      expect(formatPerfumeName('CHANEL-no-5')).toBe('Chanel No 5');
    });

    it('should handle multiple consecutive hyphens', () => {
      expect(formatPerfumeName('word--another')).toBe('Word  Another');
    });

    it('should capitalize each word after hyphen', () => {
      expect(formatPerfumeName('one-two-three-four')).toBe('One Two Three Four');
    });
  });

  describe('formatBrand', () => {
    it('should format brand with hyphens', () => {
      expect(formatBrand('tom-ford')).toBe('Tom Ford');
      expect(formatBrand('yves-saint-laurent')).toBe('Yves Saint Laurent');
    });

    it('should capitalize first letter of each word', () => {
      expect(formatBrand('dior')).toBe('Dior');
      expect(formatBrand('chanel')).toBe('Chanel');
      expect(formatBrand('versace')).toBe('Versace');
    });

    it('should handle brands with spaces', () => {
      expect(formatBrand('tom ford')).toBe('Tom Ford');
      expect(formatBrand('dolce gabbana')).toBe('Dolce Gabbana');
    });

    it('should handle empty string', () => {
      expect(formatBrand('')).toBe('');
    });

    it('should handle all uppercase', () => {
      expect(formatBrand('GUCCI')).toBe('Gucci');
      expect(formatBrand('ARMANI')).toBe('Armani');
    });

    it('should handle mixed case', () => {
      expect(formatBrand('DiOR')).toBe('Dior');
      expect(formatBrand('cHaNel')).toBe('Chanel');
    });

    it('should handle brands with multiple words and spaces', () => {
      expect(formatBrand('yves saint laurent')).toBe('Yves Saint Laurent');
      expect(formatBrand('jean paul gaultier')).toBe('Jean Paul Gaultier');
    });

    it('should handle brands with hyphens correctly', () => {
      expect(formatBrand('jean-paul-gaultier')).toBe('Jean Paul Gaultier');
    });
  });

  describe('formatPerfumista', () => {
    it('should format perfumista name with hyphens', () => {
      expect(formatPerfumista('alberto-morillas')).toBe('Alberto Morillas');
      expect(formatPerfumista('olivier-polge')).toBe('Olivier Polge');
    });

    it('should capitalize first letter of each word', () => {
      expect(formatPerfumista('jacques cavallier')).toBe('Jacques Cavallier');
      expect(formatPerfumista('francois demachy')).toBe('Francois Demachy');
    });

    it('should handle empty string', () => {
      expect(formatPerfumista('')).toBe('');
    });

    it('should handle single name', () => {
      expect(formatPerfumista('alberto')).toBe('Alberto');
    });

    it('should handle all uppercase', () => {
      expect(formatPerfumista('ALBERTO MORILLAS')).toBe('Alberto Morillas');
    });

    it('should handle mixed case', () => {
      expect(formatPerfumista('aLbErTo MoRiLlAs')).toBe('Alberto Morillas');
    });

    it('should handle names with multiple words', () => {
      expect(formatPerfumista('jean claude ellena')).toBe('Jean Claude Ellena');
    });

    it('should handle names with hyphens correctly', () => {
      expect(formatPerfumista('jean-claude-ellena')).toBe('Jean Claude Ellena');
    });

    it('should handle compound last names', () => {
      expect(formatPerfumista('maria del carmen')).toBe('Maria Del Carmen');
    });
  });

  describe('edge cases', () => {
    it('should handle null or undefined gracefully', () => {
      expect(formatPerfumeName(null as any)).toBe('');
      expect(formatPerfumeName(undefined as any)).toBe('');
      expect(formatBrand(null as any)).toBe('');
      expect(formatBrand(undefined as any)).toBe('');
      expect(formatPerfumista(null as any)).toBe('');
      expect(formatPerfumista(undefined as any)).toBe('');
    });

    it('should handle strings with only hyphens', () => {
      expect(formatPerfumeName('---')).toBe('   ');
      expect(formatBrand('---')).toBe('   ');
    });

    it('should handle strings with trailing/leading hyphens', () => {
      expect(formatPerfumeName('-word-')).toBe(' Word ');
      expect(formatBrand('-brand-')).toBe(' Brand ');
    });

    it('should handle very long names', () => {
      const longName = 'word-'.repeat(20) + 'end';
      const result = formatPerfumeName(longName);
      expect(result).toContain('Word');
      expect(result).toContain('End');
    });

    it('should handle special characters', () => {
      expect(formatPerfumeName("l'eau")).toBe("L'eau");
      expect(formatBrand("l'oreal")).toBe("L'oreal");
    });

    it('should handle numbers in names', () => {
      expect(formatPerfumeName('chanel-no-5')).toBe('Chanel No 5');
      expect(formatPerfumeName('212-men')).toBe('212 Men');
    });
  });
});
