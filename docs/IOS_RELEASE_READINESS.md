# FitSwap — preparação iOS 1.6.6

Verificado em 26/09/2026. Preparação técnica validada; build assinado de distribuição ainda não gerado nem enviado.

## Correções concluídas

- RevenueCat: a Offering `default` já tinha os pacotes Monthly e Annual corretos. O entitlement `Fitswap Pro` tinha somente produtos da Test Store; foram associados também `Plano_Pro_Nutriverse` e `Plano_Pro_Anual` da Apple. Ambos estão aprovados no App Store Connect. Credenciais Apple válidas e chave pública iOS do código conferida com o painel.
- Compras: IDs reais no serviço; falhas de inicialização nativa não habilitam compras simuladas. Liberação Pro exige entitlement confirmado. Verificação indisponível preserva o perfil em vez de rebaixá-lo. Removida função obsoleta `upgradeToPro`.
- Paywall: preços e economia vêm da Offering; planos indisponíveis ficam desabilitados e falha de carregamento permite tentar novamente. Customer Center corrigido.
- EAS: `BRANCH_API_KEY`, `BRANCH_DOMAIN_LINK`, `BRANCH_DOMAIN_LINK_ALT` e `EXPO_PUBLIC_AFFILIATES_API_URL` confirmadas em Production. Perfil production seleciona esse ambiente e rejeita configuração Branch incompleta.
- Branch: plugin compatível com Expo 54 e inclusão de `branch.json` corrigida e verificada no app compilado. NativeLink permanece ativo, incluindo leitura de link copiado na primeira abertura.
- Versão atualizada para 1.6.6: a versão 1.6.5 já aparece pronta para distribuição no App Store Connect. Auto-incremento do build mantido no EAS.
- Dependências Expo alinhadas; removidas dependências IAP não utilizadas e CLI Expo antiga.
- 17 imagens de receitas convertidas para JPEG: aproximadamente 20,50 MiB → 3,53 MiB. Indicador de uso gratuito existente preservado.
- `.afiliados-work/` excluído do versionamento; nenhum segredo incluído nos commits.

## Validação

- TypeScript sem erros; cinco testes de assinatura/configuração aprovados.
- `expo install --check`: dependências atualizadas.
- `expo-doctor`: 17/18 verificações aprovadas. Resta aviso de metadados do React Native Directory para Branch/plugin; compatibilidade nativa foi verificada por compilação.
- Exportação iOS de produção concluída.
- Prebuild e instalação de 105 pods concluídos em cópia isolada.
- Xcode Debug para simulador iOS ARM64: **BUILD SUCCEEDED**, com Branch e RevenueCat. `branch.json` presente no bundle. Isso não valida assinatura de distribuição nem compras reais/sandbox.
- Log local temporário: `/private/tmp/fitswap-native-build-final.log`.

## App Privacy publicada; política do site pendente

O histórico de compras foi publicado na App Privacy como vinculado à identidade, para análise/funcionalidade, sem rastreamento. Após autorização explícita do usuário, saúde, condicionamento físico e ID do dispositivo também foram publicados. O App Store Connect confirmou a publicação e não apresenta mais tipos de dados com configuração pendente.

Declarações publicadas com autorização, todas vinculadas à identidade e sem rastreamento publicitário:

| Dados | Finalidades |
| --- | --- |
| Saúde | Personalização e funcionalidade do app |
| Condicionamento físico | Personalização e funcionalidade do app |
| ID do dispositivo | Análise e funcionalidade do app |

A ausência de rastreamento publicitário pressupõe o uso atual de Branch para indicação, sem integrações de publicidade entre apps/sites. Confirmar caso o uso externo ao código seja diferente.

`docs/privacy.html` e `docs/privacy-policy.html` foram atualizados localmente para refletir perfil nutricional, Firebase, RevenueCat, Branch/NativeLink e atribuição de afiliados. Essas alterações ainda não foram publicadas no site. Commits locais não foram enviados ao remoto.

## Próximas etapas

1. Publicar a política de privacidade atualizada no site; as declarações da App Privacy já estão concluídas.
2. Autenticar a CLI EAS (o navegador está autenticado) e gerar o build iOS com o perfil production. Conferir a numeração remota e a assinatura no processo.
3. Enviar ao TestFlight e testar compra mensal/anual sandbox, restauração, falha/cancelamento de compra e indicação com app instalado e após instalação/login.
4. Antes da revisão Apple, atualizar screenshots e descrição para refletir o plano gratuito e a assinatura atuais.

Referências: [privacidade Apple no RevenueCat](https://www.revenuecat.com/docs/platform-resources/apple-platform-resources/apple-app-privacy), [App Privacy da Apple](https://developer.apple.com/app-store/app-privacy-details/).
