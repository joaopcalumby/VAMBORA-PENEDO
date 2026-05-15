# 🚨 Sistema de Alertas - Resumo Visual

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Vue.js)                           │
│                   AlertasComponent.vue                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ [Filtros] [Atraso] [Horário] [Rota] [Proximidade]       │   │
│  │                                                           │   │
│  │ ┌─────────────────────────────────────────────────────┐  │   │
│  │ │ 🔴 ALTA SEVERIDADE - Atraso na linha 101            │  │   │
│  │ │ A linha está 20 minutos atrasada                     │  │   │
│  │ │ ⏰ 20 minutos de atraso                               │  │   │
│  │ │ 10:30 [✓ Marcar lido] [✕ Fechar]                     │  │   │
│  │ └─────────────────────────────────────────────────────┘  │   │
│  │                                                           │   │
│  │ ┌─────────────────────────────────────────────────────┐  │   │
│  │ │ 🟡 MÉDIA - Mudança de Horário - Linha 201          │  │   │
│  │ │ Horário alterado de 10:30 para 10:45               │  │   │
│  │ │ 10:35 [✓] [✕]                                        │  │   │
│  │ └─────────────────────────────────────────────────────┘  │   │
│  │                                                           │   │
│  │ ┌─────────────────────────────────────────────────────┐  │   │
│  │ │ 🚌 VEÍCULOS PRÓXIMOS                                 │  │   │
│  │ │ ┌─────────────┐ Ônibus 101 - 2 min                  │  │   │
│  │ │ │     2       │ 456 metros de distância             │  │   │
│  │ │ │    min      │                                      │  │   │
│  │ │ └─────────────┘                                      │  │   │
│  │ └─────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            ↕ API REST
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (FastAPI)                           │
│                        main.py                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 📍 GET /alertas - Listar com filtros                     │   │
│  │ 📍 POST /alertas - Criar alerta genérico               │   │
│  │ 📍 PATCH /alertas/{id}/lido - Marcar como lido         │   │
│  │ 📍 PATCH /alertas/{id}/desativar - Desativar           │   │
│  │                                                           │   │
│  │ ⏰ POST /alertas/atrasos - Criar alerta de atraso      │   │
│  │ 🕐 POST /alertas/mudanca-horario - Mudança horário    │   │
│  │ 🛣️ POST /alertas/mudanca-rota - Mudança de rota        │   │
│  │                                                           │   │
│  │ 📍 POST /alertas/proximidade - Criar monitoramento     │   │
│  │ 📍 PATCH /alertas/proximidade/{id}/localizacao - Update│   │
│  │ 📍 GET /alertas/proximidade/user/{id} - Listar ativos │   │
│  │ 📍 GET /alertas/proximidade-simulado/{id} - Simular   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            ↕ ORM
┌─────────────────────────────────────────────────────────────────┐
│                      BANCO DE DADOS                              │
│  ┌──────────────────┐         ┌──────────────────────────────┐   │
│  │    alertas       │         │   alertas_proximidade        │   │
│  ├──────────────────┤         ├──────────────────────────────┤   │
│  │ id (PK)          │         │ id (PK)                      │   │
│  │ titulo           │         │ user_id (FK)                 │   │
│  │ descricao        │         │ linha_id (FK)                │   │
│  │ tipo             │◄────┐   │ latitude_usuario             │   │
│  │ severidade       │     │   │ longitude_usuario            │   │
│  │ ativa            │     │   │ latitude_veiculo             │   │
│  │ lido             │     │   │ longitude_veiculo            │   │
│  │ minutos_atraso   │     │   │ distancia_metros             │   │
│  │ horario_anterior │     │   │ eta_minutos                  │   │
│  │ horario_novo     │     │   │ ativo                        │   │
│  │ id_linha (FK)    ├─────┼───│ data_criacao                 │   │
│  │ data_criacao     │     │   │ data_ultima_atualizacao      │   │
│  │ data_atualizacao │     │   └──────────────────────────────┘   │
│  └──────────────────┘     │                                       │
│                           └──> Relacionamento com Linha           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tipos de Alertas

### 1️⃣ Alerta de Atraso (⏰)
```
POST /alertas/atrasos
├─ id_linha: 1
└─ minutos_atraso: 20

Severidade automática:
├─ > 15 min → ALTA 🔴
└─ ≤ 15 min → MÉDIA 🟡
```

### 2️⃣ Alerta de Mudança de Horário (🕐)
```
POST /alertas/mudanca-horario
├─ id_linha: 1
├─ horario_anterior: "10:30"
└─ horario_novo: "10:45"

Severidade: MÉDIA 🟡
```

### 3️⃣ Alerta de Mudança de Rota (🛣️)
```
POST /alertas/mudanca-rota
├─ id_linha: 2
└─ descricao_mudanca: "Desvio na Av. Principal"

Severidade: ALTA 🔴
```

### 4️⃣ Alerta de Proximidade (📍)
```
POST /alertas/proximidade?user_id=1
├─ linha_id: 1
├─ latitude_usuario: -8.7661
├─ longitude_usuario: -36.5113
├─ latitude_veiculo: -8.7665
├─ longitude_veiculo: -36.5115
└─ eta_minutos: 10

Atualização em tempo real via:
PATCH /alertas/proximidade/{id}/localizacao
```

---

## Fluxo de Uso

### Cenário 1: Usuário recebe notificação de atraso

```
1. Sistema detecta atraso de 20 min na linha 101
   ↓
2. POST /alertas/atrasos
   └─ Cria alert com severidade ALTA
   ↓
3. Frontend polling GET /alertas a cada 30s
   ↓
4. Exibe alerta com ícone 🔴 piscante
   ↓
5. Usuário clica "Marcar como lido"
   └─ PATCH /alertas/{id}/lido
```

### Cenário 2: Monitoramento de proximidade

```
1. Usuário ativa alerta de proximidade
   └─ POST /alertas/proximidade?user_id=1
   ↓
2. Sistema recebe localização do veículo em tempo real
   └─ PATCH /alertas/proximidade/{id}/localizacao
   ↓
3. Frontend polling GET /alertas/proximidade/user/1 a cada 5s
   ↓
4. Se eta_minutos ≤ 1:
   └─ Exibe "Seu transporte está chegando! 🚌"
   ↓
5. Usuário fecha o alerta
   └─ PATCH /alertas/proximidade/{id}/desativar
```

---

## Status e Cores

| Status | Cor | Significado | Ícone |
|--------|-----|-----------|-------|
| Severidade ALTA | 🔴 Vermelho | Urgente | ⚠️ |
| Severidade MÉDIA | 🟡 Amarelo | Atenção | ⚡ |
| Severidade BAIXA | 🟢 Verde | Informação | ℹ️ |
| Não lido | **Negrito** | Novo | 📬 |
| Lido | Normal | Visualizado | 📭 |

---

## Estados do Alerta

```
CRIADO
  ↓
  ├─ [Usuário marca como lido] → LIDO
  ├─ [Usuário fecha] → DESATIVADO
  ├─ [Sistema desativa] → DESATIVADO
  └─ [Usuário ingora] → PERMANECE ATIVO
```

---

## Exemplo de resposta completa

```json
{
  "id": 1,
  "titulo": "Atraso na linha 101",
  "descricao": "A linha está 20 minutos atrasada",
  "tipo": "atraso",
  "severidade": "alta",
  "ativa": true,
  "lido": false,
  "data_criacao": "2026-04-13T10:30:00",
  "data_atualizacao": "2026-04-13T10:30:00",
  "minutos_atraso": 20,
  "horario_anterior": null,
  "horario_novo": null,
  "id_linha": 1
}
```

---

## Implementação Futura - WebSocket

Para notificações em tempo real:

```javascript
// Cliente conecta ao WebSocket
const ws = new WebSocket('ws://localhost:8000/ws/alertas/user/1');

ws.onmessage = (event) => {
  const alerta = JSON.parse(event.data);
  // Atualizar UI instantaneamente
  mostrarNotificacao(alerta.titulo);
  reproduzirSom();
};

// Servidor envia notificação assim que alerta é criado
ws.send(JSON.stringify({
  type: 'novo_alerta',
  alerta: { ... }
}));
```

---

## Arquivos do Projeto

```
VAMBORA-PENEDO/
├── backend/
│   ├── app/
│   │   ├── main.py (✅ 490 linhas - com 20 novos endpoints)
│   │   ├── models.py (✅ Alerta + AlertaProximidade)
│   │   ├── schemas.py (✅ 10+ schemas de resposta)
│   │   └── database.py
│   └── requirements.txt
├── frontend/
│   └── AlertasComponent.vue (✅ Componente visual completo)
├── ALERTAS_API_DOCS.md (✅ Documentação detalhada)
├── testar-alertas.sh (✅ Script de teste)
└── README.md (✅ Este arquivo)
```

---

## Como Começar

1. **Copiar o componente Vue:**
   ```
   cp frontend/AlertasComponent.vue src/components/
   ```

2. **Importar no seu main.js:**
   ```javascript
   import AlertasComponent from '@/components/AlertasComponent.vue'
   
   app.component('AlertasComponent', AlertasComponent)
   ```

3. **Usar na template:**
   ```html
   <AlertasComponent />
   ```

4. **Testar a API:**
   ```bash
   bash testar-alertas.sh
   ```

---

## Próximas Fases

- [ ] WebSocket para atualizações em tempo real
- [ ] Notificações push (FCM para Android)
- [ ] Dashboard administrativo de alertas
- [ ] Analytics e relatórios
- [ ] Integração com SMS/Email
- [ ] Geofencing automático
- [ ] Machine Learning para previsão de atrasos
