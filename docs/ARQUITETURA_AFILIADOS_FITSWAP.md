# Arquitetura do programa de afiliados FitSwap

## Objetivo

O programa atribui cada novo assinante a um criador/afiliado por meio de um link individual. A atribuição é automática: a pessoa não copia nem informa código no site ou no aplicativo. Depois de atribuída, ela é permanente e as compras, renovações e reembolsos continuam associados ao mesmo criador.

## Componentes

| Componente | Responsabilidade |
| --- | --- |
| Painel de Afiliados | Cadastro e gestão de criadores, geração de links, relatórios e pagamentos. Projeto `Downloads/Afiliados`. |
| Branch | Link de indicação, deep link e atribuição após instalação (deferred deep linking). |
| Landing `/join/[codigo]` | Compatibilidade com links antigos e alternativa web; explica a indicação, sem exibir ou solicitar código. |
| App FitSwap | Recebe a atribuição do Branch ou o link legado, guarda-a temporariamente e a envia ao backend após o login/cadastro. |
| API de Afiliados | Valida o criador, grava a atribuição imutável e calcula comissões. |
| Firebase/Firestore | Autenticação do usuário e persistência da atribuição, criadores, eventos e saldo. |
| RevenueCat | Processamento e sinalização de eventos de assinatura da App Store/Google Play. Não é o mecanismo de deep link. |

## Fluxo principal

```text
Criador recebe link Branch individual
        |
        v
Pessoa clica no link
        |
        +-- App já instalado --> Branch abre o FitSwap com `affiliate_referral_code`
        |
        +-- App não instalado --> loja correspondente --> primeira abertura do FitSwap
                                                        |
                                                        v
                                               Branch recupera a atribuição
                                                        |
                                                        v
                                             Login ou cadastro no Firebase
                                                        |
                                                        v
                                   API valida e grava o criador uma única vez no Firestore
                                                        |
                                                        v
                              Compra/renovação/reembolso --> RevenueCat webhook --> comissão do criador
```

## Jornada do influenciador

O influenciador não precisa instalar, configurar ou entender o Branch. Ele recebe um acesso ao Painel de Afiliados e divulga um link exclusivo, já pronto para funcionar em iPhone e Android.

### 1. Convite e ativação

O administrador cadastra o criador no painel com nome, e-mail, canais de divulgação, regra de comissão e dados de pagamento exigidos pelo programa. O servidor cria uma conta no **Firebase Authentication**, grava o respectivo `auth_uid` no cadastro do criador e envia um convite de ativação para o e-mail informado.

O e-mail contém um link único e com expiração para o portal, por exemplo `https://afiliados-app.vercel.app/ativar?...`. Ele não contém senha temporária. No primeiro acesso, o influenciador:

1. cria a senha e confirma o e-mail;
2. preenche ou confirma os dados de pagamento/fiscais necessários;
3. aceita os termos do programa;
4. vê o status da conta como pendente, ativa ou suspensa.

O criador só pode receber pagamentos depois da aprovação administrativa e da validação dos dados obrigatórios.

Depois da ativação, o acesso é feito em `https://afiliados-app.vercel.app` com o próprio e-mail e senha. A opção “Esqueci minha senha” usa o e-mail de recuperação do Firebase. As APIs do portal não confiam em um `creator_id` enviado pelo navegador: validam o token Firebase e encontram o criador pelo `auth_uid`, de modo que um criador não pode abrir os dados de outro.

### Estado atual e entrega pendente

O portal já possui a tela de login Firebase, recuperação de senha e a validação por `auth_uid`. Porém, o cadastro administrativo atual cria somente o registro no Firestore; ele **ainda não cria a conta Firebase nem vincula o `auth_uid`**. Portanto, o convite automático acima precisa ser implementado antes de cadastrar influenciadores reais.

A implementação deve ser feita no backend administrativo em quatro ações atômicas:

1. criar (ou localizar) a conta no Firebase Authentication pelo e-mail;
2. gravar o `auth_uid` na ficha do criador no Firestore;
3. gerar um link de definição de senha com expiração;
4. enviar o convite por provedor transacional (por exemplo, Resend), registrando status e data do convite, sem registrar senhas.

### 2. Link individual

Quando o cadastro é aprovado, o painel disponibiliza para o criador:

- um **link único de indicação** Branch, por exemplo `https://<dominio-branch>/abc123`;
- um botão para copiar e compartilhar o link;
- QR Code do mesmo link, para materiais impressos, vídeos ou eventos;
- uma URL de landing de contingência, mantida para campanhas legadas.

O link é o único item que o influenciador precisa compartilhar. Ele não deve enviar códigos, instruções para instalar o app, URLs da loja manualmente ou links encurtados por terceiros — isso pode reduzir a atribuição.

### 3. Material e instruções de divulgação

O painel deve apresentar uma área “Como divulgar” com conteúdo pronto para uso:

- mensagem curta para bio, Stories, WhatsApp e DM;
- imagens e vídeos aprovados do FitSwap;
- aviso de transparência publicitária, como `#pub` ou “link de afiliado”, quando aplicável;
- explicação simples: “Abra meu link; se o FitSwap ainda não estiver instalado, instale e abra o app pelo fluxo normal. Sua indicação será aplicada automaticamente.”;
- proibições: prometer resultado de saúde, criar cupons não autorizados, alterar a marca ou fazer anúncios pagos com palavras reservadas, se estas forem regras do programa.

O painel não mostra o código técnico do criador como instrução de compartilhamento. Caso ele exista internamente, é apenas um identificador do sistema.

### 4. O que o influenciador acompanha

Em seu painel, cada criador vê somente seus próprios dados, idealmente em quatro grupos:

| Área | Informações |
| --- | --- |
| Desempenho | Cliques no link, instalações/atribuições elegíveis, conversões e taxa de conversão. |
| Receita | Compras aprovadas, renovações, reembolsos, comissão gerada, saldo pendente e saldo disponível. |
| Pagamentos | Histórico de repasses, período de referência, método de pagamento e comprovante. |
| Materiais | Link, QR Code, textos, criativos, termos e regras atualizados. |

Por privacidade, ele não vê nomes, e-mails, histórico alimentar ou qualquer dado pessoal dos usuários indicados.

### 5. Ciclo financeiro

1. Uma compra ou renovação confirmada pelo RevenueCat gera uma comissão para o criador atribuído.
2. O valor permanece como **pendente** durante a janela de contestação/reembolso definida pelo programa.
3. Se houver reembolso, a comissão correspondente é cancelada ou ajustada.
4. No fechamento do período, com saldo mínimo e dados de pagamento válidos, o administrador aprova e executa o repasse.
5. O criador acompanha no painel o status: pendente, aprovado, pago ou ajustado.

### Comunicação recomendada ao criador

> Seu link exclusivo já está ativo. Compartilhe-o diretamente com sua audiência: ele abre o FitSwap ou direciona para instalação. A indicação é registrada automaticamente; não peça para a pessoa digitar códigos. Acompanhe cliques, conversões e comissões pelo seu painel.

## Regras de operação para o influenciador

- Um criador usa apenas o próprio link oficial.
- Não há troca manual de criador após uma atribuição válida.
- Vendas próprias, fraudes, cliques artificiais e métodos de divulgação proibidos podem ser auditados, recusados ou suspensos.
- Comissões são calculadas sobre eventos confirmados pelo RevenueCat e ficam sujeitas a reembolso e às regras publicadas do programa.
- Alterações de chave Pix/conta de pagamento exigem validação administrativa antes do próximo repasse.

## Links de indicação

### Novo padrão

O painel gera um link Branch para cada criador. O link carrega somente dados técnicos mínimos:

- `affiliate_referral_code`: identificador interno do criador;
- `affiliate_app_id`: `fitswap`;
- URL de fallback/canônica: `https://<painel>/join/<codigo>`.

O identificador não é apresentado ao usuário e não é aceito por campos de formulário. O app só o utiliza para fazer a atribuição autenticada no backend.

### Compatibilidade

Os links públicos antigos em `/join/CODIGO` continuam funcionando. Eles levam à landing e podem abrir o app instalado pelo esquema legado. Campanhas novas devem usar somente os links Branch criados pelo painel.

## Atribuição no FitSwap

1. Na inicialização, o app assina o listener do SDK Branch.
2. O listener aceita apenas eventos marcados como link Branch clicado e extrai `affiliate_referral_code`.
3. O código é validado e persistido localmente, para sobreviver até o usuário concluir autenticação.
4. Após login ou cadastro, o app consulta/aciona a API de atribuição.
5. A API verifica se o usuário já possui criador vinculado. Se possuir, não altera o vínculo; se não possuir, valida o criador e o grava.
6. A confirmação e o estado do vínculo são mantidos no Firestore, que é a fonte de verdade.

Essa regra impede que links repetidos, um novo link de outro criador ou tentativas de manipulação troquem um criador já atribuído.

## Assinaturas e comissões

O RevenueCat é responsável pelas assinaturas; o Branch não participa de cobrança.

1. O usuário compra uma assinatura pelo FitSwap.
2. A loja processa o pagamento e o RevenueCat recebe o evento.
3. O webhook do RevenueCat autenticado chama a API de Afiliados.
4. A API encontra o criador já associado ao usuário e registra o evento financeiro.
5. Compra inicial, renovação e reembolso atualizam as métricas e saldo do mesmo criador.

Portanto, Branch resolve **quem indicou**; RevenueCat resolve **o que foi pago, renovado ou reembolsado**.

## Configuração e segredos

### Branch

Criar um aplicativo FitSwap no Branch com:

- iOS bundle ID: `com.victoralmeidaj16.foodnutriverse`;
- Android package: `com.victoralmeidaj16.foodnutriverse`;
- URLs da App Store e Google Play;
- domínio Branch primário e alternativo;
- NativeLink habilitado para iOS.

Variáveis necessárias no EAS e no Vercel:

```dotenv
BRANCH_API_KEY=
BRANCH_DOMAIN_LINK=
BRANCH_DOMAIN_LINK_ALT=
```

O painel usa a chave para criar links. O app recebe a chave e os domínios no processo de configuração nativa. Nenhuma chave é colocada em telas, links públicos ou repositórios.

### E-mail operacional

Será criada a caixa `clinicavivermais@clinicavivermais.cloud` para cadastrar e administrar a conta Branch. Ela deve ter senha exclusiva, recuperação configurada e acesso restrito aos responsáveis pelo FitSwap.

## Entregas já preparadas no código

- Remoção de qualquer campo/mensagem de código de convite no login, cadastro e landing.
- Integração `react-native-branch` e configuração Expo para domínios, Associated Domains iOS, App Links Android e NativeLink.
- Listener Branch no FitSwap e persistência segura até autenticação.
- Geração de links Branch pelo Painel de Afiliados, com fallback para links legados enquanto as credenciais não forem cadastradas.
- Script de migração para gerar links Branch para criadores FitSwap existentes.
- Atualização das instruções de RevenueCat e Branch nos dois projetos.

## Próximas etapas de ativação

1. Contratar e criar o e-mail operacional no domínio próprio.
2. Criar e configurar a conta/aplicativo Branch.
3. Cadastrar as variáveis Branch no Vercel (Painel) e EAS (FitSwap).
4. Executar a migração dos links dos criadores existentes.
5. Gerar builds nativos novos quando a configuração estiver pronta — Expo Go não suporta essa integração.
6. Testar iOS e Android com app instalado e instalação nova, além de compra, renovação e reembolso.

## Critérios de aceite

- Nenhum usuário vê ou digita código de indicação.
- Um link de criador abre o app instalado e atribui o criador correto.
- Uma instalação nova preserva a atribuição até a primeira abertura, dentro das capacidades de matching do Branch.
- Um usuário já atribuído não muda de criador.
- Eventos do RevenueCat atualizam somente o criador atribuído.
- Links antigos continuam direcionando à landing como compatibilidade.
