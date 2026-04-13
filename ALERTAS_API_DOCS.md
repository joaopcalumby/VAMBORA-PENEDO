# 🚨 Sistema de Alertas - Documentação Completa

## Visão Geral

O sistema de alertas do Vambora Penedo fornece notificações em tempo real sobre:
- ⏰ **Atrasos** - Veículos atrasados nas linhas
- 🕐 **Mudanças de Horário** - Alterações nos horários de partida
- 🛣️ **Mudanças de Rota** - Desvios e alterações nas rotas
- 📍 **Proximidade** - Notificações quando um veículo está chegando

---

## Endpoints da API

### 1. **Alertas Gerais**

#### Listar Alertas com Filtros
```http
GET /alertas?id_linha=1&tipo=atraso&severidade=alta&apenas_nao_lidos=true
```

**Parâmetros Query:**
- `id_linha` (int, opcional) - Filtrar por linha específica
- `tipo` (string, opcional) - Tipos: `atraso`, `mudanca_horario`, `mudanca_rota`, `proximidade`
- `severidade` (string, opcional) - `baixa`, `media`, `alta`
- `apenas_nao_lidos` (boolean, default: false) - Mostrar apenas alertas não lidos

**Response:**
```json
[
  {
    "id": 1,
    "titulo": "Atraso na linha 101",
    "descricao": "A linha está 15 minutos atrasada",
    "tipo": "atraso",
    "severidade": "media",
    "ativa": true,
    "lido": false,
    "data_criacao": "2026-04-13T10:30:00",
    "data_atualizacao": "2026-04-13T10:30:00",
    "minutos_atraso": 15,
    "horario_anterior": null,
    "horario_novo": null,
    "id_linha": 1
  }
]
```

---

#### Obter Alerta Específico
```http
GET /alertas/{alerta_id}
```

**Response:** Um objeto de alerta com todos os detalhes.

---

#### Marcar Alerta como Lido
```http
PATCH /alertas/{alerta_id}/lido
```

**Response:**
```json
{
  "status": "sucesso",
  "message": "Alerta marcado como lido"
}
```

---

#### Desativar Alerta
```http
PATCH /alertas/{alerta_id}/desativar
```

**Response:**
```json
{
  "status": "sucesso",
  "message": "Alerta desativado"
}
```

---

### 2. **Alertas de Atraso**

#### Criar Alerta de Atraso
```http
POST /alertas/atrasos
```

**Request Body:**
```json
{
  "id_linha": 1,
  "minutos_atraso": 20
}
```

**Response:** Alerta criado com severidade automática baseada no tempo de atraso.
- Atraso > 15 minutos = severidade `alta`
- Atraso ≤ 15 minutos = severidade `media`

---

### 3. **Alertas de Mudança de Horário**

#### Criar Alerta de Mudança de Horário
```http
POST /alertas/mudanca-horario
```

**Request Body:**
```json
{
  "id_linha": 1,
  "horario_anterior": "10:30",
  "horario_novo": "10:45"
}
```

**Response:** Alerta de severidade `media` criado.

---

### 4. **Alertas de Mudança de Rota**

#### Criar Alerta de Mudança de Rota
```http
POST /alertas/mudanca-rota
```

**Request Body:**
```json
{
  "id_linha": 2,
  "descricao_mudanca": "Desvio temporário na Avenida Principal devido a obras. Rota alternativa disponível no mapa."
}
```

**Response:** Alerta de severidade `alta` criado.

---

### 5. **Alertas de Proximidade** 🚌

#### Criar Alerta de Proximidade
Registra un usuário monitorando a proximidade de um veículo da linha.

```http
POST /alertas/proximidade?user_id=1
```

**Request Body:**
```json
{
  "linha_id": 1,
  "latitude_usuario": -8.7661,
  "longitude_usuario": -36.5113,
  "latitude_veiculo": -8.7665,
  "longitude_veiculo": -36.5115,
  "eta_minutos": 5
}
```

**Response:**
```json
{
  "id": 5,
  "user_id": 1,
  "linha_id": 1,
  "latitude_usuario": -8.7661,
  "longitude_usuario": -36.5113,
  "latitude_veiculo": -8.7665,
  "longitude_veiculo": -36.5115,
  "distancia_metros": 556,
  "eta_minutos": 5,
  "ativo": true,
  "data_criacao": "2026-04-13T10:35:00",
  "data_ultima_atualizacao": "2026-04-13T10:35:00"
}
```

---

#### Atualizar Localização do Veículo
Atualiza a posição do veículo para um alerta de proximidade em tempo real.

```http
PATCH /alertas/proximidade/{alerta_id}/localizacao
```

**Query Parameters:**
- `latitude_veiculo` (float) - Nova latitude
- `longitude_veiculo` (float) - Nova longitude
- `eta_minutos` (int, opcional) - ETA estimado em minutos

**Response:**
```json
{
  "status": "sucesso",
  "message": "Localização atualizada",
  "eta_minutos": 3
}
```

---

#### Listar Alertas de Proximidade do Usuário
```http
GET /alertas/proximidade/user/{user_id}
```

**Response:** Lista de todos os alertas de proximidade ativos do usuário ordenados por data de atualização.

---

#### Desativar Alerta de Proximidade
```http
PATCH /alertas/proximidade/{alerta_id}/desativar
```

**Response:**
```json
{
  "status": "sucesso",
  "message": "Alerta de proximidade desativado"
}
```

---

#### Simulador de Proximidade (Testes)
Simula um veículo se aproximando para testes e demonstração.

```http
GET /alertas/proximidade-simulado/{linha_id}?user_id=1&lat_usuario=-8.7661&lon_usuario=-36.5113
```

**Response Example:**
```json
{
  "linha": "Ônibus 101",
  "status": "veiculo_proximo",
  "distancia_metros": 556,
  "eta_minutos": 2,
  "latitude_veiculo": -8.7660,
  "longitude_veiculo": -36.5112,
  "mensagem": "Seu transporte está chegando! 🚌"
}
```

---

## Exemplo Completo de Fluxo

### 1. Usuário ativa alerta de proximidade
```bash
curl -X POST "http://localhost:8000/alertas/proximidade?user_id=1" \
  -H "Content-Type: application/json" \
  -d '{
    "linha_id": 1,
    "latitude_usuario": -8.7661,
    "longitude_usuario": -36.5113,
    "eta_minutos": 10
  }'
```

### 2. Sistema recebe atualização de localização do veículo
```bash
curl -X PATCH "http://localhost:8000/alertas/proximidade/5/localizacao?latitude_veiculo=-8.7662&longitude_veiculo=-36.5114&eta_minutos=5"
```

### 3. Sistema continua atualizando
```bash
curl -X PATCH "http://localhost:8000/alertas/proximidade/5/localizacao?latitude_veiculo=-8.7663&longitude_veiculo=-36.5115&eta_minutos=2"
```

### 4. Frontend recebe atualização e exibe "Seu transporte está chegando! 🚌"

---

## Tipos de Alerta e Ícones

| Tipo | Ícone | Severidade | Descrição |
|------|-------|-----------|-----------|
| atraso | ⏰ | Alta/Média | Veículo atrasado |
| mudanca_horario | 🕐 | Média | Alteração no horário |
| mudanca_rota | 🛣️ | Alta | Desvio na rota |
| proximidade | 📍 | Baixa | Veículo se aproximando |

---

## Integração Frontend

### Carregar alertas periodicamente
```javascript
// Atualizar a cada 30 segundos
setInterval(async () => {
  const response = await fetch('/alertas?apenas_nao_lidos=false');
  const alertas = await response.json();
  // Atualizar componente com novos alertas
}, 30000);
```

### Monitorar proximidade em tempo real
```javascript
// Verificar proximidade a cada 5 segundos
setInterval(async () => {
  const response = await fetch('/alertas/proximidade/user/1');
  const alertasProximidade = await response.json();
  
  // Para cada alerta, lidar com o ETA
  alertasProximidade.forEach(alerta => {
    if (alerta.eta_minutos <= 1) {
      // Notificar! 🚌
      mostrarNotificacao(`${alerta.linha.nome} está chegando!`);
    }
  });
}, 5000);
```

### WebSocket para notificações em tempo real (futuro)
```javascript
// Conexão WebSocket para atualizações instantâneas
const ws = new WebSocket('ws://localhost:8000/ws/alertas/1');
ws.onmessage = (event) => {
  const alerta = JSON.parse(event.data);
  mostrarNotificação(alerta.titulo);
};
```

---

## Notas de Implementação

1. **Severidade Automática**: Atrasos > 15 min = severidade `alta`
2. **Timestamp**: Todos os alertas incluem `data_criacao` e `data_atualizacao`
3. **Status de Leitura**: Alertas podem ser marcados como `lido` ou `nao_lido`
4. **Ativação**: Use `ativa=false` para desativar alertas sem deletar
5. **Geolocalização**: As coordenadas estão em latitude/longitude (WGS84)
6. **ETA**: Calculado em minutos para melhor UX

---

## Futuras Implementações

- [ ] Notificações push (Android/iOS)
- [ ] Integração com WebSockets para tempo real
- [ ] Cálculo preciso de distância (Haversine)
- [ ] Geofencing automático
- [ ] Integração com SMS/Email
- [ ] Dashboard administrativo
- [ ] Analytics de alertas
