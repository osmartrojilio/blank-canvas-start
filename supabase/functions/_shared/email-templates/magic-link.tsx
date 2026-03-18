/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu link de acesso — Gerenciar Frotas</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://xtxzhaddomtwlktuhkxf.supabase.co/storage/v1/object/public/email-assets/logo-gerenciar-frotas.png" width="180" height="auto" alt="Gerenciar Frotas" style={logo} />
        <Heading style={h1}>Seu link de acesso</Heading>
        <Text style={text}>Clique no botão abaixo para acessar o Gerenciar Frotas. Este link expira em breve.</Text>
        <Button style={button} href={confirmationUrl}>Acessar</Button>
        <Text style={footer}>Se você não solicitou este link, ignore este e-mail.</Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 24px', maxWidth: '480px', margin: '0 auto' }
const logo = { marginBottom: '24px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#7c8594', lineHeight: '1.6', margin: '0 0 20px' }
const button = { backgroundColor: '#eda611', color: '#0f172a', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '12px', padding: '14px 24px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '32px 0 0' }
