#!/bin/bash
# Script para testar o sistema de alertas

BASE_URL="http://localhost:8000"

echo "🚨 Testando Sistema de Alertas - Vambora Penedo"
echo "================================================"
echo ""

# 1. Criar alerta de atraso
echo "1️⃣  Criando alerta de ATRASO..."
ALERTA_ATRASO=$(curl -s -X POST "$BASE_URL/alertas/atrasos" \
  -H "Content-Type: application/json" \
  -d '{"id_linha": 1, "minutos_atraso": 20}')
echo "✓ Resposta:"
echo "$ALERTA_ATRASO" | python -m json.tool
echo ""

# 2. Criar alerta de mudança de horário
echo "2️⃣  Criando alerta de MUDANÇA DE HORÁRIO..."
ALERTA_HORARIO=$(curl -s -X POST "$BASE_URL/alertas/mudanca-horario" \
  -H "Content-Type: application/json" \
  -d '{"id_linha": 1, "horario_anterior": "10:30", "horario_novo": "10:45"}')
echo "✓ Resposta:"
echo "$ALERTA_HORARIO" | python -m json.tool
echo ""

# 3. Criar alerta de mudança de rota
echo "3️⃣  Criando alerta de MUDANÇA DE ROTA..."
ALERTA_ROTA=$(curl -s -X POST "$BASE_URL/alertas/mudanca-rota" \
  -H "Content-Type: application/json" \
  -d '{"id_linha": 2, "descricao_mudanca": "Desvio na Avenida Principal devido a obras"}')
echo "✓ Resposta:"
echo "$ALERTA_ROTA" | python -m json.tool
echo ""

# 4. Listar alertas
echo "4️⃣  Listando TODOS OS ALERTAS..."
curl -s "$BASE_URL/alertas" | python -m json.tool
echo ""

# 5. Filtrar alertas por tipo
echo "5️⃣  Filtrando alertas por TIPO: atraso..."
curl -s "$BASE_URL/alertas?tipo=atraso" | python -m json.tool
echo ""

# 6. Criar alerta de proximidade
echo "6️⃣  Criando alerta de PROXIMIDADE (simular usuário 1)..."
ALERTA_PROX=$(curl -s -X POST "$BASE_URL/alertas/proximidade?user_id=1" \
  -H "Content-Type: application/json" \
  -d '{
    "linha_id": 1,
    "latitude_usuario": -8.7661,
    "longitude_usuario": -36.5113,
    "latitude_veiculo": -8.7665,
    "longitude_veiculo": -36.5115,
    "eta_minutos": 10
  }')
echo "✓ Resposta:"
echo "$ALERTA_PROX" | python -m json.tool
ALERTA_ID=$(echo "$ALERTA_PROX" | python -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo "ID do alerta de proximidade: $ALERTA_ID"
echo ""

# 7. Listar alertas de proximidade do usuário
echo "7️⃣  Listando alertas de PROXIMIDADE do usuário 1..."
curl -s "$BASE_URL/alertas/proximidade/user/1" | python -m json.tool
echo ""

# 8. Atualizar localização do veículo
echo "8️⃣  Atualizando localização do veículo (ETA: 5 min)..."
curl -s -X PATCH "$BASE_URL/alertas/proximidade/$ALERTA_ID/localizacao?latitude_veiculo=-8.7663&longitude_veiculo=-36.5114&eta_minutos=5" | python -m json.tool
echo ""

# 9. Simular aproximação
echo "9️⃣  SIMULADOR: Veículo se aproximando..."
curl -s "$BASE_URL/alertas/proximidade-simulado/1?user_id=1&lat_usuario=-8.7661&lon_usuario=-36.5113" | python -m json.tool
echo ""

# 10. Marcar alerta como lido
echo "🔟 Marcando primeiro alerta como LIDO..."
curl -s -X PATCH "$BASE_URL/alertas/1/lido" | python -m json.tool
echo ""

# 11. Listar apenas alertas não lidos
echo "Listando apenas alertas NÃO LIDOS..."
curl -s "$BASE_URL/alertas?apenas_nao_lidos=true" | python -m json.tool
echo ""

# 12. Filtrar por severidade
echo "Filtrando alertas com severidade ALTA..."
curl -s "$BASE_URL/alertas?severidade=alta" | python -m json.tool
echo ""

echo ""
echo "================================================"
echo "✅ Testes concluídos!"
echo "================================================"
