"""
Tests for i18n (Internationalization) System
"""
import pytest
from app.i18n.loader import LanguageLoader
from app.i18n.config import SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE


def test_language_loader_initialization():
    """Test LanguageLoader initialization"""
    loader = LanguageLoader()

    assert loader is not None
    assert loader._cache is not None
    assert isinstance(loader._cache, dict)
    assert len(loader._cache) == 0  # Initially empty


def test_get_language_module_spanish():
    """Test loading Spanish language module"""
    loader = LanguageLoader()

    module = loader.get_language_module("es")

    assert module is not None
    assert hasattr(module, "TIME_OF_DAY")
    assert hasattr(module, "PERFUME_LABELS")
    assert hasattr(module, "PROMPT_TEMPLATE")


def test_get_language_module_english():
    """Test loading English language module"""
    loader = LanguageLoader()

    module = loader.get_language_module("en")

    assert module is not None
    assert hasattr(module, "TIME_OF_DAY")
    assert hasattr(module, "PERFUME_LABELS")
    assert hasattr(module, "PROMPT_TEMPLATE")


def test_get_language_module_caching():
    """Test that language modules are cached"""
    loader = LanguageLoader()

    # Load module first time
    module1 = loader.get_language_module("es")
    assert "es" in loader._cache

    # Load same module second time (should come from cache)
    module2 = loader.get_language_module("es")

    # Should be the same object (from cache)
    assert module1 is module2


def test_get_language_module_unsupported_language():
    """Test loading unsupported language falls back to default"""
    loader = LanguageLoader()

    # Try to load unsupported language
    module = loader.get_language_module("fr")

    # Should fallback to default language (es)
    assert module is not None
    assert hasattr(module, "TIME_OF_DAY")


def test_get_time_of_day_spanish():
    """Test getting time of day dictionary in Spanish"""
    loader = LanguageLoader()

    time_of_day = loader.get_time_of_day("es")

    assert isinstance(time_of_day, dict)
    assert "morning" in time_of_day
    assert "afternoon" in time_of_day
    assert "night" in time_of_day

    assert time_of_day["morning"] == "mañana"
    assert time_of_day["afternoon"] == "tarde"
    assert time_of_day["night"] == "noche"


def test_get_time_of_day_english():
    """Test getting time of day dictionary in English"""
    loader = LanguageLoader()

    time_of_day = loader.get_time_of_day("en")

    assert isinstance(time_of_day, dict)
    assert time_of_day["morning"] == "morning"
    assert time_of_day["afternoon"] == "afternoon"
    assert time_of_day["night"] == "night"


def test_get_perfume_labels_spanish():
    """Test getting perfume labels in Spanish"""
    loader = LanguageLoader()

    labels = loader.get_perfume_labels("es")

    assert isinstance(labels, dict)
    assert "perfumer" in labels
    assert "accords" in labels
    assert "notes" in labels

    assert labels["perfumer"] == "perfumista"
    assert labels["accords"] == "acordes"
    assert labels["notes"] == "notas"


def test_get_perfume_labels_english():
    """Test getting perfume labels in English"""
    loader = LanguageLoader()

    labels = loader.get_perfume_labels("en")

    assert isinstance(labels, dict)
    assert labels["perfumer"] == "perfumer"
    assert labels["accords"] == "accords"
    assert labels["notes"] == "notes"


def test_get_prompt_template_spanish():
    """Test getting prompt template in Spanish"""
    loader = LanguageLoader()

    template = loader.get_prompt_template("es")

    assert isinstance(template, str)
    assert len(template) > 0
    assert "{direccion}" in template
    assert "{fecha_evento}" in template
    assert "{perfumes_text}" in template
    assert "perfumista" in template  # Spanish word


def test_get_prompt_template_english():
    """Test getting prompt template in English"""
    loader = LanguageLoader()

    template = loader.get_prompt_template("en")

    assert isinstance(template, str)
    assert len(template) > 0
    assert "{direccion}" in template


def test_multiple_languages_loaded():
    """Test loading multiple languages in same loader"""
    loader = LanguageLoader()

    # Load Spanish
    es_module = loader.get_language_module("es")
    # Load English
    en_module = loader.get_language_module("en")

    # Both should be cached
    assert "es" in loader._cache
    assert "en" in loader._cache

    # Should be different modules
    assert es_module is not en_module


def test_language_loader_global_instance():
    """Test that global language_loader instance exists"""
    from app.i18n.loader import language_loader

    assert language_loader is not None
    assert isinstance(language_loader, LanguageLoader)


def test_supported_languages_config():
    """Test SUPPORTED_LANGUAGES configuration"""
    assert isinstance(SUPPORTED_LANGUAGES, (list, tuple, set))
    assert len(SUPPORTED_LANGUAGES) >= 2  # At least Spanish and English
    assert "es" in SUPPORTED_LANGUAGES
    assert "en" in SUPPORTED_LANGUAGES


def test_default_language_config():
    """Test DEFAULT_LANGUAGE configuration"""
    assert DEFAULT_LANGUAGE is not None
    assert DEFAULT_LANGUAGE in SUPPORTED_LANGUAGES
    assert DEFAULT_LANGUAGE == "es"  # Spanish is default


def test_fallback_to_default_language():
    """Test that unsupported languages fallback correctly"""
    loader = LanguageLoader()

    # Try various unsupported language codes
    unsupported = ["fr", "de", "it", "pt", "ja", "zh", "ru", "ar"]

    for lang_code in unsupported:
        module = loader.get_language_module(lang_code)
        # Should get a valid module (the default one)
        assert module is not None
        assert hasattr(module, "TIME_OF_DAY")


def test_prompt_template_formatting():
    """Test that prompt template can be formatted correctly"""
    loader = LanguageLoader()

    template = loader.get_prompt_template("es")

    # Test that template can be formatted with all required fields
    formatted = template.format(
        direccion="Av. Providencia 1234, Santiago, Chile",
        lugar_nombre="Test Place",
        lugar_tipo="cerrado",
        lugar_descripcion="Av. Providencia 1234, Santiago, Chile",
        fecha_evento="2025-03-15",
        hora_evento="18:00",
        tipo_espacio_desc="Espacio cerrado (interior)",
        momento_dia="noche",
        clima_descripcion="despejado",
        temperatura=22,
        humedad=65,
        ocasion="cena",
        proximidad="media",
        expectativa="elegancia",
        vestimenta="formal",
        perfumes_text="Test perfumes"
    )

    assert "Test Place" in formatted
    assert "Santiago, Chile" in formatted
    assert "Test perfumes" in formatted


def test_language_module_structure():
    """Test that language modules have consistent structure"""
    loader = LanguageLoader()

    for lang_code in ["es", "en"]:
        module = loader.get_language_module(lang_code)

        # Check all required attributes exist
        assert hasattr(module, "TIME_OF_DAY")
        assert hasattr(module, "PERFUME_LABELS")
        assert hasattr(module, "PROMPT_TEMPLATE")

        # Check types
        assert isinstance(module.TIME_OF_DAY, dict)
        assert isinstance(module.PERFUME_LABELS, dict)
        assert isinstance(module.PROMPT_TEMPLATE, str)

        # Check required keys
        assert "morning" in module.TIME_OF_DAY
        assert "perfumer" in module.PERFUME_LABELS


def test_cache_persistence():
    """Test that cache persists across multiple calls"""
    loader = LanguageLoader()

    # First call
    loader.get_time_of_day("es")
    cache_size_1 = len(loader._cache)

    # More calls
    loader.get_time_of_day("es")
    loader.get_perfume_labels("es")
    cache_size_2 = len(loader._cache)

    # Cache size should not increase (same language)
    assert cache_size_1 == cache_size_2 == 1

    # Load different language
    loader.get_time_of_day("en")
    cache_size_3 = len(loader._cache)

    # Cache size should increase
    assert cache_size_3 == 2
