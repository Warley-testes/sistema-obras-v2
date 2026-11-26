import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigured } from './lib/supabase'

type Obra = { id: string; nome: string; cidade: string | null; perfil: string }

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [obras, setObras] = useState<Obra[]>([])
  const [selected, setSelected] = useState<Obra | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [dark, setDark] = useState(false)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setSelected(null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    async function loadObras() {
      if (!supabase || !session) { setObras([]); return }
      const { data, error } = await supabase
        .from('usuarios_obra')
        .select('perfil, obras(id, nome, cidade)')
        .eq('ativo', true)
      if (error) { setMessage('Não foi possível carregar suas obras. Confira se o banco foi configurado.'); return }
      const list = (data ?? []).flatMap((item: any) => item.obras
        ? [{ ...item.obras, perfil: item.perfil } as Obra] : [])
      setObras(list)
      setMessage(list.length ? '' : 'Seu acesso ainda não foi vinculado a uma obra. Peça ao administrador para liberar seu usuário.')
    }
    void loadObras()
  }, [session])

  async function entrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    setLoading(true); setMessage('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    setMessage(error ? error.message : 'Enviamos um link de acesso para seu e-mail. Abra a mensagem neste dispositivo.')
    setLoading(false)
  }

  async function sair() {
    if (!supabase) return
    await supabase.auth.signOut()
    setSelected(null)
  }

  if (!supabaseConfigured) return (
    <main className="setup">
      <div className="setup-card">
        <div className="eyebrow">SISTEMA DE OBRAS · V2</div>
        <h1>Fundação pronta.<br /><span>Falta conectar o banco.</span></h1>
        <p>O projeto inicial foi criado. Para ativar o login, precisamos criar o projeto Supabase e preencher as duas configurações locais.</p>
        <div className="steps"><b>Próximo passo</b><ol><li>Criar o projeto no Supabase.</li><li>Executar a migração SQL deste repositório.</li><li>Preencher o arquivo <code>.env.local</code> com a URL e a chave publicável.</li></ol></div>
        <a className="primary" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">Abrir Supabase ↗</a>
      </div>
    </main>
  )

  return (
    <div className={dark ? 'app dark' : 'app'}>
      <aside className="sidebar">
        <div className="brand-mark">SO<span> / </span>02</div>
        <div className="brand-copy"><strong>SISTEMA DE OBRAS</strong><small>GESTÃO INTEGRADA</small></div>
        <div className="side-bottom"><span>AMBIENTE V2</span><button onClick={() => setDark(!dark)} aria-label="Alternar tema">{dark ? '☀' : '◐'}</button></div>
      </aside>
      <main className="main">
        <header className="topbar"><span>PLATAFORMA DE GESTÃO</span><span className="status"><i /> AMBIENTE DE CONFIGURAÇÃO</span></header>
        {!session ? (
          <section className="login-layout">
            <div className="intro"><div className="eyebrow">NOVA PLATAFORMA · ETAPA 01</div><h1>Obra bem gerida.<br /><em>Decisão bem feita.</em></h1><p>Uma base única para acompanhar campo, equipe, financeiro, planejamento e qualidade — com acesso controlado por obra.</p><div className="intro-rule" /><small>ACESSO SEGURO · LINK MÁGICO · CONTROLE DE PERMISSÕES</small></div>
            <form className="login-card" onSubmit={entrar}><div className="eyebrow">IDENTIFICAÇÃO</div><h2>Acessar sistema</h2><p>Informe seu e-mail corporativo. Você receberá um link seguro para entrar.</p><label htmlFor="email">E-MAIL</label><input id="email" type="email" autoComplete="email" required placeholder="voce@empresa.com.br" value={email} onChange={e => setEmail(e.target.value)} /><button className="primary" disabled={loading}>{loading ? 'ENVIANDO…' : 'ENVIAR LINK DE ACESSO'}</button>{message && <div className="notice">{message}</div>}<small>Seu acesso depende de um convite e das permissões cadastradas no banco.</small></form>
          </section>
        ) : selected ? (
          <section className="welcome"><div className="eyebrow">ÁREA DE TRABALHO</div><h1>{selected.nome}</h1><p>{selected.cidade || 'Local não informado'} · Perfil: {selected.perfil}</p><div className="placeholder-panel"><span>ESTRUTURA INICIAL</span><h2>Esta obra está selecionada.</h2><p>As áreas do sistema serão liberadas nas próximas etapas de construção.</p></div><button className="secondary" onClick={() => setSelected(null)}>← Voltar às obras</button></section>
        ) : (
          <section className="welcome"><div className="eyebrow">ACESSO AUTENTICADO</div><h1>Escolha uma obra</h1><p>{session.user.email}</p><div className="obra-grid">{obras.map(obra => <button className="obra-card" key={obra.id} onClick={() => setSelected(obra)}><span>OBRA / {obra.perfil.toUpperCase()}</span><strong>{obra.nome}</strong><small>{obra.cidade || 'Cidade não informada'}</small><b>ABRIR ÁREA →</b></button>)}</div>{message && <div className="notice">{message}</div>}<button className="text-button" onClick={sair}>Sair da conta</button></section>
        )}
        <footer>© {new Date().getFullYear()} SISTEMA DE OBRAS · V2 <span>AMBIENTE EM CONSTRUÇÃO</span></footer>
      </main>
    </div>
  )
}
