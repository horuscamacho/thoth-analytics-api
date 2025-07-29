#!/bin/bash

# THOTH ANALYTICS API - SCRIPT DE ACTUALIZACIÓN DE COLECCIÓN
# Propósito: Automatizar la actualización de la colección de Insomnia

set -e

echo "🚀 Actualizando colección de Insomnia..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directorio de la colección
COLLECTION_DIR="$(dirname "$0")"
COLLECTION_FILE="$COLLECTION_DIR/thoth-analytics-api-collection.json"
BACKUP_DIR="$COLLECTION_DIR/backups"

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

# Función para hacer backup
backup_collection() {
    if [ -f "$COLLECTION_FILE" ]; then
        local timestamp=$(date +"%Y%m%d_%H%M%S")
        local backup_file="$BACKUP_DIR/thoth-collection-backup-$timestamp.json"
        cp "$COLLECTION_FILE" "$backup_file"
        echo -e "${GREEN}✅ Backup creado: $backup_file${NC}"
    fi
}

# Función para validar JSON
validate_json() {
    local file="$1"
    if command -v jq >/dev/null 2>&1; then
        if jq empty "$file" 2>/dev/null; then
            echo -e "${GREEN}✅ JSON válido${NC}"
            return 0
        else
            echo -e "${RED}❌ JSON inválido${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  jq no instalado, saltando validación JSON${NC}"
        return 0
    fi
}

# Función para mostrar estadísticas
show_stats() {
    if command -v jq >/dev/null 2>&1; then
        local requests=$(jq '[.resources[] | select(._type == "request")] | length' "$COLLECTION_FILE")
        local folders=$(jq '[.resources[] | select(._type == "request_group")] | length' "$COLLECTION_FILE")
        local environments=$(jq '[.resources[] | select(._type == "environment")] | length' "$COLLECTION_FILE")
        
        echo -e "${BLUE}📊 Estadísticas de la colección:${NC}"
        echo -e "   Requests: $requests"
        echo -e "   Carpetas: $folders" 
        echo -e "   Entornos: $environments"
    fi
}

# Función principal de actualización
update_collection() {
    echo -e "${BLUE}🔄 Iniciando actualización...${NC}"
    
    # Hacer backup
    backup_collection
    
    # Verificar si existe la colección
    if [ ! -f "$COLLECTION_FILE" ]; then
        echo -e "${RED}❌ Archivo de colección no encontrado: $COLLECTION_FILE${NC}"
        exit 1
    fi
    
    # Validar JSON actual
    if ! validate_json "$COLLECTION_FILE"; then
        echo -e "${RED}❌ La colección actual tiene errores JSON${NC}"
        exit 1
    fi
    
    # Actualizar timestamp de exportación
    local current_date=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
    
    if command -v jq >/dev/null 2>&1; then
        # Actualizar fecha de exportación usando jq
        jq --arg date "$current_date" '.__export_date = $date' "$COLLECTION_FILE" > "$COLLECTION_FILE.tmp"
        mv "$COLLECTION_FILE.tmp" "$COLLECTION_FILE"
        echo -e "${GREEN}✅ Timestamp actualizado${NC}"
    fi
    
    # Mostrar estadísticas
    show_stats
    
    echo -e "${GREEN}✅ Colección actualizada exitosamente${NC}"
}

# Función para instalar dependencias
install_deps() {
    echo -e "${BLUE}🔧 Verificando dependencias...${NC}"
    
    if ! command -v jq >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  jq no está instalado${NC}"
        echo -e "${BLUE}💡 Para instalar jq:${NC}"
        echo -e "   macOS: ${GREEN}brew install jq${NC}"
        echo -e "   Ubuntu: ${GREEN}sudo apt-get install jq${NC}"
        echo ""
    else
        echo -e "${GREEN}✅ jq está instalado${NC}"
    fi
}

# Función para mostrar ayuda
show_help() {
    echo -e "${BLUE}🔧 THOTH API - Script de Actualización de Colección${NC}"
    echo ""
    echo "Uso: $0 [OPCIÓN]"
    echo ""
    echo "Opciones:"
    echo "  update    Actualizar la colección (por defecto)"
    echo "  backup    Crear solo un backup"
    echo "  validate  Validar JSON de la colección"
    echo "  stats     Mostrar estadísticas"
    echo "  deps      Verificar dependencias"
    echo "  help      Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 update"
    echo "  $0 backup"
    echo "  $0 validate"
}

# Procesar argumentos
case "${1:-update}" in
    "update")
        update_collection
        ;;
    "backup")
        backup_collection
        ;;
    "validate")
        validate_json "$COLLECTION_FILE"
        ;;
    "stats")
        show_stats
        ;;
    "deps")
        install_deps
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo -e "${RED}❌ Opción desconocida: $1${NC}"
        show_help
        exit 1
        ;;
esac

echo -e "${GREEN}🎉 Proceso completado${NC}"