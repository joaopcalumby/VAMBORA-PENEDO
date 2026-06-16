# Dados do seed

Esta pasta contém os arquivos de dados que o seed (`python -m app.seed`)
lê para popular o banco. O seed é idempotente — pode rodar quantas vezes
quiser que não duplica registros.

## Arquivos

| Arquivo                         | O que contém                                        |
|---------------------------------|-----------------------------------------------------|
| `categorias.yaml`               | Categorias tarifárias (Padrão, Estudante, etc.)     |
| `linhas.yaml`                   | Metadados das linhas (nome, modal, tarifas)         |
| `horarios.yaml`                 | Horários de partida por linha e por tipo de dia     |
| `usuarios.yaml`                 | Admin + motoristas pré-aprovados para demonstração  |
| `linha_<NN>_<modal>.geojson`    | Pontos de parada e traçado de cada linha            |

## GeoJSONs (pontos e rotas)

Cada arquivo GeoJSON representa **uma linha**. Convenção de nome:
`linha_<NUMERO>_<modal>.geojson` (ex.: `linha_01_onibus.geojson`).

O arquivo deve ser um `FeatureCollection` com duas categorias de
`Feature`:

- `properties.tipo == "ponto_parada"` →
  `geometry.type == "Point"` →
  vira um `Stop` no banco, vinculado à linha pela M:N `stop_lines`.

- `properties.tipo == "rota"` →
  `geometry.type == "LineString"` →
  vira um `Route` + sequência de `RoutePoint`s ordenados pelo
  arranjo do array `coordinates`.

Em ambos, `properties.linha` (string, ex.: `"01"`) identifica a linha
e `properties.modal` (`"onibus"` | `"van"` | `"balsa"`) o modal.

> Coordenadas em GeoJSON são `[longitude, latitude]` (ordem inversa do
> mais comum). O seed cuida da conversão.

## Fluxo de produção de dados

1. Equipe coleta coordenadas em https://geojson.io (ou ferramenta similar).
2. Salva o GeoJSON da linha em `backend/app/seed/data/linha_<NN>_<modal>.geojson`.
3. Adiciona uma entrada da linha em `linhas.yaml` (nome, modal, preços).
4. Adiciona os horários da linha em `horarios.yaml`.
5. `cd backend && python -m app.seed`
6. Verifica `GET /linhas` no Swagger ou via curl.

## Reset do banco

O seed **não apaga** dados existentes — ele só faz upsert. Para reset
total durante o desenvolvimento:

```bash
cd backend
rm vambora.db
uvicorn app.main:app --reload   # init_db() recria as tabelas vazias
python -m app.seed              # popula
```
