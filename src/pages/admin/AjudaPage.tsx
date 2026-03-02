import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Home, 
  FileText, 
  Users, 
  Calendar, 
  Mail, 
  Settings, 
  Clock,
  Briefcase,
  MessageSquare
} from "lucide-react";
import { useWhatsApp } from "@/hooks/useWhatsApp";

export default function AjudaPage() {
  const { getWhatsAppUrl, formattedPhone } = useWhatsApp();
  const guides = [
    {
      id: "home",
      icon: Home,
      title: "Como editar a Home",
      description: "Personalize a página inicial do site",
      content: `
        <p>Para editar a página inicial:</p>
        <ol>
          <li><strong>Acesse Configurações</strong> no menu lateral</li>
          <li>Na aba <strong>Geral</strong>, você pode alterar o nome da clínica, telefone, endereço e horário de funcionamento</li>
          <li>Na aba <strong>SEO</strong>, defina o título e descrição que aparecem nos resultados do Google</li>
          <li>Na aba <strong>WhatsApp</strong>, personalize a mensagem pré-preenchida do botão de WhatsApp</li>
        </ol>
        <p class="mt-4"><strong>Dica:</strong> As alterações nas configurações são refletidas automaticamente em todo o site.</p>
      `,
    },
    {
      id: "blog",
      icon: FileText,
      title: "Como criar posts no Blog",
      description: "Publique artigos e conteúdos",
      content: `
        <p>Para criar um novo post no blog:</p>
        <ol>
          <li>Acesse <strong>Blog</strong> no menu lateral</li>
          <li>Clique em <strong>Novo Post</strong></li>
          <li>Preencha o título (o slug será gerado automaticamente)</li>
          <li>Escolha uma categoria para o post</li>
          <li>Escreva um resumo curto (aparece nas listagens)</li>
          <li>Adicione o conteúdo completo (suporta HTML)</li>
          <li>Adicione uma imagem de capa (URL)</li>
          <li>Escolha o status: <strong>Rascunho</strong> para salvar sem publicar, ou <strong>Publicado</strong> para ir ao ar imediatamente</li>
          <li>Clique em <strong>Criar</strong></li>
        </ol>
      `,
    },
    {
      id: "services",
      icon: Briefcase,
      title: "Como cadastrar serviços",
      description: "Gerencie os serviços oferecidos",
      content: `
        <p>Para adicionar ou editar serviços:</p>
        <ol>
          <li>Acesse <strong>Serviços</strong> no menu lateral</li>
          <li>Clique em <strong>Novo Serviço</strong></li>
          <li>Preencha o nome do serviço (ex: Avaliação Psicológica)</li>
          <li>Adicione uma descrição detalhada</li>
          <li>Defina a duração em minutos (padrão: 50 min)</li>
          <li>Se desejar, informe o preço</li>
          <li>Marque as modalidades disponíveis: Presencial e/ou Online</li>
          <li>Clique em <strong>Criar</strong></li>
        </ol>
        <p class="mt-4"><strong>Importante:</strong> Serviços inativos não aparecem para agendamento.</p>
      `,
    },
    {
      id: "professionals",
      icon: Users,
      title: "Como cadastrar profissionais",
      description: "Adicione a equipe ao sistema",
      content: `
        <p>Para cadastrar um profissional:</p>
        <ol>
          <li>Acesse <strong>Profissionais</strong> no menu lateral</li>
          <li>Clique em <strong>Novo Profissional</strong></li>
          <li>Preencha nome, e-mail e telefone</li>
          <li>Adicione o registro profissional (CRP, CRM, etc.)</li>
          <li>Liste as especialidades (separadas por vírgula)</li>
          <li>Escreva uma breve biografia</li>
          <li>Marque as modalidades de atendimento</li>
          <li>Selecione os serviços que o profissional atende</li>
          <li>Clique em <strong>Criar</strong></li>
        </ol>
      `,
    },
    {
      id: "availability",
      icon: Clock,
      title: "Como abrir horários na agenda",
      description: "Configure a disponibilidade dos profissionais",
      content: `
        <p>Para configurar horários de atendimento:</p>
        <ol>
          <li>Acesse <strong>Disponibilidade</strong> no menu lateral</li>
          <li>Na aba <strong>Horários</strong>, clique em <strong>Nova Regra</strong></li>
          <li>Selecione o profissional</li>
          <li>Escolha o dia da semana</li>
          <li>Defina o horário de início e fim</li>
          <li>Clique em <strong>Criar</strong></li>
        </ol>
        <p class="mt-4"><strong>Para bloqueios/folgas:</strong></p>
        <ol>
          <li>Acesse a aba <strong>Bloqueios/Folgas</strong></li>
          <li>Clique em <strong>Novo Bloqueio</strong></li>
          <li>Selecione o profissional e o período</li>
          <li>Opcionalmente, informe o motivo</li>
          <li>Clique em <strong>Criar</strong></li>
        </ol>
      `,
    },
    {
      id: "appointments",
      icon: Calendar,
      title: "Como gerenciar consultas",
      description: "Confirme, remarque ou cancele agendamentos",
      content: `
        <p>Para gerenciar agendamentos:</p>
        <ol>
          <li>Acesse <strong>Agendamentos</strong> no menu lateral</li>
          <li>Use os filtros para encontrar agendamentos específicos</li>
          <li>Para <strong>confirmar</strong>: clique no ícone de check verde</li>
          <li>Para <strong>cancelar</strong>: clique no X vermelho</li>
          <li>Para <strong>ver detalhes</strong>: clique no ícone de olho</li>
          <li>Para <strong>marcar como concluído</strong>: após a consulta confirmada, clique no check azul</li>
        </ol>
        <p class="mt-4"><strong>Status disponíveis:</strong></p>
        <ul>
          <li><strong>Pendente:</strong> Aguardando confirmação</li>
          <li><strong>Confirmado:</strong> Consulta confirmada</li>
          <li><strong>Concluído:</strong> Consulta realizada</li>
          <li><strong>Cancelado:</strong> Consulta cancelada</li>
        </ul>
      `,
    },
    {
      id: "email",
      icon: Mail,
      title: "Como configurar e-mails",
      description: "Personalize os templates de e-mail",
      content: `
        <p>Para editar os templates de e-mail:</p>
        <ol>
          <li>Acesse <strong>Templates de E-mail</strong> no menu lateral</li>
          <li>Clique em <strong>Editar</strong> no template desejado</li>
          <li>Modifique o assunto e o conteúdo HTML</li>
          <li>Use as variáveis disponíveis para personalização automática</li>
          <li>Ative ou desative o template conforme necessário</li>
          <li>Clique em <strong>Salvar</strong></li>
        </ol>
        <p class="mt-4"><strong>Variáveis disponíveis:</strong></p>
        <p>{{cliente_nome}}, {{servico_nome}}, {{data}}, {{hora}}, {{modalidade}}, {{codigo_consulta}}, {{profissional}}, {{endereco}}, {{link_online}}, {{whatsapp}}</p>
      `,
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold mb-2">Guia Rápido</h1>
        <p className="text-muted-foreground">Aprenda a usar o painel administrativo</p>
      </div>

      <div className="grid gap-4">
        <Accordion type="single" collapsible className="space-y-4">
          {guides.map((guide) => (
            <AccordionItem key={guide.id} value={guide.id} className="border rounded-xl px-6">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <guide.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">{guide.title}</h3>
                    <p className="text-sm text-muted-foreground">{guide.description}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-6">
                <div
                  className="prose prose-sm max-w-none text-muted-foreground [&_ol]:list-decimal [&_ol]:ml-6 [&_ul]:list-disc [&_ul]:ml-6 [&_li]:mb-2 [&_p]:mb-3"
                  dangerouslySetInnerHTML={{ __html: guide.content }}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <MessageSquare className="w-6 h-6 text-primary mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Precisa de mais ajuda?</h3>
              <p className="text-sm text-muted-foreground">
                Entre em contato pelo WhatsApp{" "}
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {formattedPhone}
                </a>{" "}
                ou envie um e-mail para{" "}
                <a
                  href="mailto:centropsicoavaliar@gmail.com"
                  className="text-primary hover:underline"
                >
                  centropsicoavaliar@gmail.com
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
