# Estrutura do Banco de Dados - gerenciarfrotas

## Tabelas

### 1. organizations
Armazena as organizações/empresas do sistema.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | Não | gen_random_uuid() |
| name | text | Não | - |
| slug | text | Não | - |
| cnpj | text | Sim | - |
| logo_url | text | Sim | - |
| plan_id | uuid | Sim | - |
| subscription_status | subscription_status | Sim | 'trialing' |
| subscription_ends_at | timestamp with time zone | Sim | - |
| trial_ends_at | timestamp with time zone | Sim | now() + 14 days |
| currency | text | Sim | 'BRL' |
| timezone | text | Sim | 'America/Sao_Paulo' |
| fiscal_period_start | integer | Sim | 1 |
| is_active | boolean | Sim | true |
| created_at | timestamp with time zone | Não | now() |
| updated_at | timestamp with time zone | Não | now() |

---

### 2. profiles
Perfis de usuários vinculados ao auth.users.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | Não | - |
| organization_id | uuid | Sim | - |
| full_name | text | Sim | - |
| avatar_url | text | Sim | - |
| phone | text | Sim | - |
| is_owner | boolean | Não | false |
| created_at | timestamp with time zone | Não | now() |
| updated_at | timestamp with time zone | Não | now() |

---

### 3. user_roles
Papéis dos usuários dentro das organizações.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | Não | gen_random_uuid() |
| user_id | uuid | Não | - |
| organization_id | uuid | Não | - |
| role | app_role | Não | 'driver' |
| created_at | timestamp with time zone | Não | now() |

**Enum app_role:** `admin`, `manager`, `driver`

---

### 4. vehicles
Veículos da frota.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | Não | gen_random_uuid() |
| organization_id | uuid | Não | - |
| prefix | text | Não | - |
| plate | text | Não | - |
| model | text | Não | - |
| brand | text | Sim | - |
| year | integer | Sim | - |
| color | text | Sim | - |
| chassis | text | Sim | - |
| renavam | text | Sim | - |
| fuel_type | text | Sim | 'diesel' |
| tank_capacity | numeric | Sim | - |
| current_km | integer | Sim | 0 |
| current_hours | integer | Sim | 0 |
| status | text | Sim | 'available' |
| driver_id | uuid | Sim | - |
| acquisition_date | date | Sim | - |
| acquisition_value | numeric | Sim | - |
| notes | text | Sim | - |
| created_at | timestamp with time zone | Não | now() |
| updated_at | timestamp with time zone | Não | now() |

---

### 5. drivers
Motoristas da frota.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | Não | gen_random_uuid() |
| organization_id | uuid | Não | - |
| profile_id | uuid | Não | - |
| cnh_number | text | Sim | - |
| cnh_category | text | Sim | - |
| cnh_expiry | date | Sim | - |
| hire_date | date | Sim | - |
| status | text | Sim | 'active' |
| emergency_contact | text | Sim | - |
| emergency_phone | text | Sim | - |
| notes | text | Sim | - |
| created_at | timestamp with time zone | Não | now() |
| updated_at | timestamp with time zone | Não | now() |

---

### 6. driver_salaries
Salários dos motoristas.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | Não | gen_random_uuid() |
| driver_id | uuid | Não | - |
| salary | numeric | Sim | - |
| effective_date | date | Sim | CURRENT_DATE |
| notes | text | Sim | - |
| created_at | timestamp with time zone | Sim | now() |
| updated_at | timestamp with time zone | Sim | now() |

---

### 7. trips
Viagens realizadas.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | Não | gen_random_uuid() |
| organization_id | uuid | Não | - |
| vehicle_id | uuid | Não | - |
| driver_id | uuid | Sim | - |
| origin | text | Não | - |
| destination | text | Não | - |
| start_date | timestamp with time zone | Não | - |
| end_date | timestamp with time zone | Sim | - |
| start_km | integer | Não | - |
| end_km | integer | Sim | - |
| cargo_type | text | Sim | - |
| tonnage | numeric | Sim | - |
| client_name | text | Sim | - |
| invoice_number | text | Sim | - |
| freight_value | numeric | Sim | - |
| status | text | Sim | 'scheduled' |
| notes | text | Sim | - |
| created_by | uuid | Sim | - |
| created_at | timestamp with time zone | Não | now() |
| updated_at | timestamp with time zone | Não | now() |

---

### 8. fuel_records
Registros de abastecimento.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | Não | gen_random_uuid() |
| organization_id | uuid | Não | - |
| vehicle_id | uuid | Não | - |
| driver_id | uuid | Sim | - |
| trip_id | uuid | Sim | - |
| fuel_date | timestamp with time zone | Não | now() |
| fuel_type | text | Sim | 'diesel' |
| liters | numeric | Não | - |
| price_per_liter | numeric | Não | - |
| total_value | numeric | Não | - |
| odometer | integer | Não | - |
| gas_station | text | Sim | - |
| city | text | Sim | - |
| state | text | Sim | - |
| payment_method | text | Sim | - |
| receipt_number | text | Sim | - |
| notes | text | Sim | - |
| created_by | uuid | Sim | - |
| created_at | timestamp with time zone | Não | now() |
| updated_at | timestamp with time zone | Não | now() |

---

### 9. expenses
Despesas gerais.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | Não | gen_random_uuid() |
| organization_id | uuid | Não | - |
| vehicle_id | uuid | Sim | - |
| driver_id | uuid | Sim | - |
| trip_id | uuid | Sim | - |
| expense_type | text | Não | - |
| description | text | Não | - |
| value | numeric | Não | - |
| expense_date | timestamp with time zone | Não | now() |
| due_date | date | Sim | - |
| paid_at | timestamp with time zone | Sim | - |
| supplier | text | Sim | - |
| payment_method | text | Sim | - |
| invoice_number | text | Sim | - |
| status | text | Sim | 'pending' |
| notes | text | Sim | - |
| created_by | uuid | Sim | - |
| created_at | timestamp with time zone | Não | now() |
| updated_at | timestamp with time zone | Não | now() |

---

### 10. maintenance_records
Registros de manutenção.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | Não | gen_random_uuid() |
| organization_id | uuid | Não | - |
| vehicle_id | uuid | Não | - |
| expense_id | uuid | Sim | - |
| maintenance_type | text | Não | - |
| description | text | Não | - |
| entry_date | timestamp with time zone | Não | - |
| exit_date | timestamp with time zone | Sim | - |
| entry_km | integer | Sim | - |
| exit_km | integer | Sim | - |
| service_provider | text | Sim | - |
| parts_cost | numeric | Sim | 0 |
| labor_cost | numeric | Sim | 0 |
| total_cost | numeric | Sim | 0 |
| status | text | Sim | 'scheduled' |
| next_maintenance_date | date | Sim | - |
| next_maintenance_km | integer | Sim | - |
| notes | text | Sim | - |
| created_by | uuid | Sim | - |
| created_at | timestamp with time zone | Não | now() |
| updated_at | timestamp with time zone | Não | now() |

---

### 11. attachments
Anexos (documentos, fotos, etc).

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | Não | gen_random_uuid() |
| organization_id | uuid | Não | - |
| entity_type | text | Não | - |
| entity_id | uuid | Não | - |
| file_name | text | Não | - |
| file_type | text | Não | - |
| file_size | integer | Não | - |
| file_url | text | Não | - |
| storage_path | text | Não | - |
| thumbnail_url | text | Sim | - |
| description | text | Sim | - |
| uploaded_by | uuid | Sim | - |
| created_at | timestamp with time zone | Não | now() |

---

### 12. notifications
Notificações do sistema.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | Não | gen_random_uuid() |
| organization_id | uuid | Não | - |
| user_id | uuid | Não | - |
| type | text | Não | - |
| title | text | Não | - |
| message | text | Não | - |
| data | jsonb | Sim | '{}' |
| read_at | timestamp with time zone | Sim | - |
| created_at | timestamp with time zone | Não | now() |

---

### 13. invitations
Convites para novos usuários.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | Não | gen_random_uuid() |
| organization_id | uuid | Não | - |
| email | text | Não | - |
| role | app_role | Não | 'driver' |
| token | uuid | Não | gen_random_uuid() |
| invited_by | uuid | Não | - |
| expires_at | timestamp with time zone | Não | now() + 7 days |
| accepted_at | timestamp with time zone | Sim | - |
| created_at | timestamp with time zone | Não | now() |

---

### 14. subscription_plans
Planos de assinatura.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | Não | gen_random_uuid() |
| name | text | Não | - |
| slug | text | Não | - |
| description | text | Sim | - |
| price_monthly | numeric | Não | 0 |
| max_users | integer | Sim | - |
| max_trucks | integer | Sim | - |
| features | jsonb | Sim | '[]' |
| is_active | boolean | Não | true |
| created_at | timestamp with time zone | Não | now() |
| updated_at | timestamp with time zone | Não | now() |

---

### 15. payment_events
Eventos de pagamento.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | Não | gen_random_uuid() |
| organization_id | uuid | Sim | - |
| plan_id | uuid | Sim | - |
| payment_id | text | Não | - |
| status | text | Não | - |
| amount | numeric | Sim | - |
| processed_at | timestamp with time zone | Não | now() |
| created_at | timestamp with time zone | Não | now() |

---

### 16. organization_settings
Configurações por organização.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | Não | gen_random_uuid() |
| organization_id | uuid | Não | - |
| key | text | Não | - |
| value | jsonb | Não | 'null' |
| created_at | timestamp with time zone | Não | now() |
| updated_at | timestamp with time zone | Não | now() |

---

### 17. webhook_configs
Configurações de webhooks.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | Não | gen_random_uuid() |
| organization_id | uuid | Não | - |
| name | text | Não | - |
| url | text | Não | - |
| secret | text | Não | gen_random_bytes(32) em hex |
| events | text[] | Não | '{}' |
| is_active | boolean | Não | true |
| last_triggered_at | timestamp with time zone | Sim | - |
| created_at | timestamp with time zone | Não | now() |
| updated_at | timestamp with time zone | Não | now() |

---

### 18. webhook_logs
Logs de entregas de webhooks.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | Não | gen_random_uuid() |
| organization_id | uuid | Não | - |
| webhook_id | uuid | Não | - |
| event_type | text | Não | - |
| payload | jsonb | Não | - |
| response_status | integer | Sim | - |
| response_body | text | Sim | - |
| success | boolean | Não | false |
| delivered_at | timestamp with time zone | Não | now() |

---

### 19. api_keys
Chaves de API para integrações externas.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | Não | gen_random_uuid() |
| organization_id | uuid | Não | - |
| name | text | Não | - |
| key_hash | text | Não | - |
| key_prefix | text | Não | - |
| scopes | text[] | Não | '{read}' |
| is_active | boolean | Não | true |
| expires_at | timestamp with time zone | Sim | - |
| last_used_at | timestamp with time zone | Sim | - |
| created_by | uuid | Sim | - |
| created_at | timestamp with time zone | Não | now() |

---

### 20. erp_integrations
Integrações com sistemas ERP.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | Não | gen_random_uuid() |
| organization_id | uuid | Não | - |
| provider | text | Não | - |
| api_endpoint | text | Sim | - |
| api_key_encrypted | text | Sim | - |
| is_active | boolean | Não | false |
| sync_vehicles | boolean | Não | true |
| sync_trips | boolean | Não | true |
| sync_fuel | boolean | Não | true |
| sync_expenses | boolean | Não | true |
| last_sync_at | timestamp with time zone | Sim | - |
| created_at | timestamp with time zone | Não | now() |
| updated_at | timestamp with time zone | Não | now() |

---

### 21. accounting_integrations
Integrações com sistemas contábeis.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | Não | gen_random_uuid() |
| organization_id | uuid | Não | - |
| provider | text | Não | - |
| api_endpoint | text | Sim | - |
| api_key_encrypted | text | Sim | - |
| is_active | boolean | Não | false |
| export_format | text | Não | 'csv' |
| auto_export | boolean | Não | false |
| export_day | integer | Sim | 1 |
| last_export_at | timestamp with time zone | Sim | - |
| created_at | timestamp with time zone | Não | now() |
| updated_at | timestamp with time zone | Não | now() |

---

### 22. platform_admins
Administradores da plataforma (super admins).

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | Não | gen_random_uuid() |
| user_id | uuid | Não | - |
| notes | text | Sim | - |
| created_by | uuid | Sim | - |
| created_at | timestamp with time zone | Não | now() |

---

## Enums

### app_role
- `admin`
- `manager`
- `driver`

### subscription_status
- `active`
- `trialing`
- `past_due`
- `canceled`
- `unpaid`

---

## Funções do Banco

| Função | Descrição |
|--------|-----------|
| `is_platform_admin(_user_id)` | Verifica se usuário é admin da plataforma |
| `has_role(_user_id, _role)` | Verifica se usuário tem determinado papel |
| `get_user_organization(_user_id)` | Retorna organization_id do usuário |
| `accept_invitation(_token)` | Processa aceitação de convite |
| `toggle_organization_status(_org_id, _is_active)` | Ativa/desativa organização |
| `get_all_organizations_for_admin()` | Lista todas organizações (platform admin) |
| `get_all_users_for_admin()` | Lista todos usuários (platform admin) |
| `handle_new_user()` | Trigger: cria org/profile no signup |
| `notify_invitation_accepted()` | Trigger: notifica admins quando convite aceito |
| `update_updated_at_column()` | Trigger: atualiza campo updated_at |

---

## Storage Buckets

| Bucket | Público |
|--------|---------|
| attachments | Não |

---

*Última atualização: Janeiro 2026*
