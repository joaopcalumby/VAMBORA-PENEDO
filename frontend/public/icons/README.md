# Ícones do PWA

Esta pasta deve conter os ícones que o `manifest.ts` referencia.
Os arquivos PNG não estão versionados ainda — gerá-los manualmente
a partir do logo `public/logovambora.svg` (ou da versão mais recente
da identidade visual) é responsabilidade da Frente A.

## Arquivos esperados

| Arquivo                       | Tamanho     | Purpose      | Uso                                       |
|-------------------------------|-------------|--------------|-------------------------------------------|
| `icon-192.png`                | 192 × 192   | any          | Ícone padrão (Android, atalho desktop)    |
| `icon-512.png`                | 512 × 512   | any          | Ícone grande (splash de instalação)       |
| `icon-maskable-192.png`       | 192 × 192   | maskable     | Adaptativo Android (com safe-zone)        |
| `icon-maskable-512.png`       | 512 × 512   | maskable     | Adaptativo Android (com safe-zone)        |

## Como gerar

Opção rápida (recomendada):

1. Abrir <https://maskable.app/editor>
2. Importar `public/logovambora.svg`
3. Centralizar e ajustar a margem interna até a pré-visualização ficar boa
4. Exportar nos 4 tamanhos/propósitos acima
5. Salvar em `frontend/public/icons/`

Alternativa via CLI (precisa ImageMagick ou sharp instalado):

```bash
# A partir de um SVG quadrado de alta resolução:
npx sharp-cli resize 192 192 < logo.svg > icon-192.png
npx sharp-cli resize 512 512 < logo.svg > icon-512.png
# Para maskable: adicionar safe-zone de ~10% antes do resize.
```

## Por que maskable separado

Android desenha ícones com formato variável (círculo, squircle, etc.)
e recorta o ícone. O `purpose: maskable` instrui o sistema a usar uma
versão com mais "respiro" — sem essa versão, o logo do app pode aparecer
cortado em alguns dispositivos.
