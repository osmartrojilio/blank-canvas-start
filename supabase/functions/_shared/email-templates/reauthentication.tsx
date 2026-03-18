/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu código de verificação — Gerenciar Frotas</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://xtxzhaddomtwlktuhkxf.supabase.co/storage/v1/object/public/email-assets/logo-gerenciar-frotas.png" width="180" height="auto" alt="Gerenciar Frotas" style={logo} />
        <Heading style={h1}>Código de verificação</Heading>
        <Text style={text}>Use o código abaixo para confirmar sua identidade:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>Este código expira em breve. Se você não solicitou este código, ignore este e-mail.</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 24px', maxWidth: '480px', margin: '0 auto' }
const logo = { marginBottom: '24px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#7c8594', lineHeight: '1.6', margin: '0 0 20px' }
const codeStyle = { fontFamily: 'Courier, monospace', fontSize: '28px', fontWeight: 'bold' as const, color: '#0f172a', letterSpacing: '6px', backgroundColor: '#f3f4f6', borderRadius: '12px', padding: '16px 24px', textAlign: 'center' as const, margin: '0 0 28px' }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '32px 0 0' }
