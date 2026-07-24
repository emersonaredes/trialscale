# Constituição do TrialScale — princípios inegociáveis

1. ISOLAMENTO DE TENANT: nenhuma query acessa dados sem escopo de tenant
   aplicado pelo mecanismo central. Falha na suíte de isolamento bloqueia merge.
2. DADOS SENSÍVEIS: nunca dados identificáveis de participantes de pesquisa
   no sistema, em logs ou em contexto de IA. Nunca credenciais/tokens/.env
   em código, respostas ou logs.
3. REVISÃO HUMANA: nenhum merge sem revisão e aprovação humana do diff.
   Migração de banco é revisada linha a linha; nunca aplicada direto em produção.
4. TESTES: toda lógica de negócio tem testes; motor de cálculo e lógica
   financeira exigem casos de borda. Queries sempre parametrizadas.
5. LGPD: consentimento versionado; benchmark só exibe agregações com mínimo
   de 5 tenants no recorte; dados de cadastro analíticos em faixas.
6. CONTEÚDO REGULATÓRIO: afirmações de exigência normativa carregam selo de
   origem e só são publicadas após validação humana. A plataforma é apoio à
   gestão, não certificação de conformidade.
7. SIMPLICIDADE: na dúvida entre duas soluções, a mais simples que passa nos
   testes. Abstrações só quando a terceira repetição aparecer.