const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-api`;

const paginationParams = [
  {
    name: "page",
    in: "query",
    schema: { type: "integer", default: 1 },
    description: "Número da página",
  },
  {
    name: "per_page",
    in: "query",
    schema: { type: "integer", default: 50, maximum: 100 },
    description: "Itens por página (máximo 100)",
  },
  {
    name: "order_by",
    in: "query",
    schema: { type: "string", default: "created_at" },
    description: "Campo para ordenação",
  },
  {
    name: "order_dir",
    in: "query",
    schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
    description: "Direção da ordenação",
  },
  {
    name: "status",
    in: "query",
    schema: { type: "string" },
    description: "Filtrar por status",
  },
];

const idParam = (resource: string) => ({
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
  description: `ID do ${resource}`,
});

const errorResponses = {
  "401": {
    description: "Chave de API ausente ou inválida",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: { error: { type: "string" } },
        },
      },
    },
  },
  "403": {
    description: "Permissão insuficiente (escopo)",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: { error: { type: "string" } },
        },
      },
    },
  },
  "422": {
    description: "Erro de validação",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: { error: { type: "string" } },
        },
      },
    },
  },
};

function crudPaths(
  resource: string,
  label: string,
  tag: string,
  schemaRef: string,
  createSchemaRef: string
) {
  return {
    [`/${resource}`]: {
      get: {
        tags: [tag],
        summary: `Listar ${label}`,
        description: `Retorna uma lista paginada de ${label}.`,
        parameters: paginationParams,
        responses: {
          "200": {
            description: "Lista retornada com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: `#/components/schemas/${schemaRef}` } },
                    pagination: {
                      type: "object",
                      properties: {
                        page: { type: "integer" },
                        per_page: { type: "integer" },
                        total: { type: "integer", nullable: true },
                      },
                    },
                  },
                },
              },
            },
          },
          ...errorResponses,
        },
      },
      post: {
        tags: [tag],
        summary: `Criar ${label.slice(0, -1)}`,
        description: `Cria um novo registro de ${label.slice(0, -1)}.`,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: `#/components/schemas/${createSchemaRef}` },
            },
          },
        },
        responses: {
          "201": {
            description: "Recurso criado com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: `#/components/schemas/${schemaRef}` } },
                },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    [`/${resource}/{id}`]: {
      get: {
        tags: [tag],
        summary: `Obter ${label.slice(0, -1)} por ID`,
        parameters: [idParam(label.slice(0, -1))],
        responses: {
          "200": {
            description: "Recurso encontrado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: `#/components/schemas/${schemaRef}` } },
                },
              },
            },
          },
          "404": { description: "Recurso não encontrado" },
          ...errorResponses,
        },
      },
      put: {
        tags: [tag],
        summary: `Atualizar ${label.slice(0, -1)}`,
        parameters: [idParam(label.slice(0, -1))],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: `#/components/schemas/${createSchemaRef}` },
            },
          },
        },
        responses: {
          "200": {
            description: "Recurso atualizado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: `#/components/schemas/${schemaRef}` } },
                },
              },
            },
          },
          ...errorResponses,
        },
      },
      delete: {
        tags: [tag],
        summary: `Remover ${label.slice(0, -1)}`,
        parameters: [idParam(label.slice(0, -1))],
        responses: {
          "200": {
            description: "Recurso removido",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { success: { type: "boolean" } },
                },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
  };
}

export function getOpenApiSpec() {
  return {
    openapi: "3.0.3",
    info: {
      title: "GerenciarFrotas — API Pública",
      version: "1.0.0",
      description: `API REST para integração com sistemas externos. Permite operações CRUD em veículos, viagens, abastecimentos, despesas e manutenções.

## Autenticação

Todas as requisições devem incluir o header \`x-api-key\` com uma chave válida gerada em **Configurações → Integrações → API Externa**.

\`\`\`
x-api-key: sk_sua_chave_aqui
\`\`\`

## Escopos

| Escopo | Permite |
|--------|---------|
| \`read\` | GET (consultas) |
| \`write\` | POST, PUT, DELETE |
| \`admin\` | Todos os métodos |

## Paginação

Todos os endpoints de listagem suportam paginação via query parameters: \`page\`, \`per_page\`, \`order_by\`, \`order_dir\`.

## Multi-tenant

Os dados são automaticamente filtrados pela organização vinculada à chave de API.`,
      contact: {
        name: "Suporte GerenciarFrotas",
      },
    },
    servers: [
      {
        url: BASE_URL,
        description: "Servidor de Produção",
      },
    ],
    security: [{ ApiKeyAuth: [] }],
    tags: [
      { name: "Veículos", description: "Gerenciar frota de veículos" },
      { name: "Viagens", description: "Gerenciar viagens e fretes" },
      { name: "Abastecimentos", description: "Registros de combustível" },
      { name: "Despesas", description: "Despesas operacionais" },
      { name: "Manutenções", description: "Registros de manutenção" },
    ],
    paths: {
      ...crudPaths("vehicles", "veículos", "Veículos", "Vehicle", "VehicleInput"),
      ...crudPaths("trips", "viagens", "Viagens", "Trip", "TripInput"),
      ...crudPaths("fuel_records", "abastecimentos", "Abastecimentos", "FuelRecord", "FuelRecordInput"),
      ...crudPaths("expenses", "despesas", "Despesas", "Expense", "ExpenseInput"),
      ...crudPaths("maintenance_records", "manutenções", "Manutenções", "MaintenanceRecord", "MaintenanceRecordInput"),
    },
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
          description: "Chave de API gerada em Configurações → Integrações",
        },
      },
      schemas: {
        Vehicle: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            prefix: { type: "string", example: "001" },
            plate: { type: "string", example: "ABC1D23" },
            model: { type: "string", example: "Volvo FH 540" },
            brand: { type: "string", example: "Volvo" },
            year: { type: "integer", example: 2023 },
            color: { type: "string" },
            chassis: { type: "string" },
            renavam: { type: "string" },
            fuel_type: { type: "string", example: "diesel" },
            tank_capacity: { type: "number", example: 600 },
            current_km: { type: "integer", example: 150000 },
            current_hours: { type: "integer" },
            status: { type: "string", enum: ["available", "in_use", "maintenance"], example: "available" },
            notes: { type: "string" },
            acquisition_date: { type: "string", format: "date" },
            acquisition_value: { type: "number" },
            organization_id: { type: "string", format: "uuid" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        VehicleInput: {
          type: "object",
          required: ["prefix", "plate", "model"],
          properties: {
            prefix: { type: "string", example: "002" },
            plate: { type: "string", example: "XYZ9A88" },
            model: { type: "string", example: "Scania R450" },
            brand: { type: "string", example: "Scania" },
            year: { type: "integer", example: 2024 },
            color: { type: "string" },
            chassis: { type: "string" },
            renavam: { type: "string" },
            fuel_type: { type: "string", example: "diesel" },
            tank_capacity: { type: "number", example: 500 },
            current_km: { type: "integer" },
            current_hours: { type: "integer" },
            status: { type: "string", example: "available" },
            notes: { type: "string" },
            acquisition_date: { type: "string", format: "date" },
            acquisition_value: { type: "number" },
          },
        },
        Trip: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            vehicle_id: { type: "string", format: "uuid" },
            driver_id: { type: "string", format: "uuid" },
            origin: { type: "string", example: "São Paulo, SP" },
            destination: { type: "string", example: "Rio de Janeiro, RJ" },
            start_date: { type: "string", format: "date-time" },
            end_date: { type: "string", format: "date-time" },
            start_km: { type: "integer" },
            end_km: { type: "integer" },
            freight_value: { type: "number", example: 5500 },
            cargo_type: { type: "string", example: "Grãos" },
            tonnage: { type: "number", example: 28.5 },
            client_name: { type: "string", example: "Agro Corp" },
            invoice_number: { type: "string" },
            status: { type: "string", enum: ["scheduled", "in_progress", "completed"], example: "completed" },
            notes: { type: "string" },
            organization_id: { type: "string", format: "uuid" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        TripInput: {
          type: "object",
          required: ["vehicle_id", "origin", "destination", "start_date", "start_km"],
          properties: {
            vehicle_id: { type: "string", format: "uuid" },
            driver_id: { type: "string", format: "uuid" },
            origin: { type: "string", example: "São Paulo, SP" },
            destination: { type: "string", example: "Curitiba, PR" },
            start_date: { type: "string", format: "date-time" },
            end_date: { type: "string", format: "date-time" },
            start_km: { type: "integer", example: 150000 },
            end_km: { type: "integer" },
            freight_value: { type: "number", example: 4200 },
            cargo_type: { type: "string", example: "Grãos" },
            tonnage: { type: "number", example: 28.5 },
            client_name: { type: "string" },
            invoice_number: { type: "string" },
            status: { type: "string", example: "scheduled" },
            notes: { type: "string" },
          },
        },
        FuelRecord: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            vehicle_id: { type: "string", format: "uuid" },
            driver_id: { type: "string", format: "uuid" },
            trip_id: { type: "string", format: "uuid" },
            fuel_date: { type: "string", format: "date-time" },
            liters: { type: "number", example: 350 },
            price_per_liter: { type: "number", example: 6.29 },
            total_value: { type: "number", example: 2201.5 },
            odometer: { type: "integer", example: 151200 },
            gas_station: { type: "string", example: "Posto Shell" },
            city: { type: "string", example: "Campinas" },
            state: { type: "string", example: "SP" },
            fuel_type: { type: "string", example: "diesel" },
            payment_method: { type: "string" },
            receipt_number: { type: "string" },
            notes: { type: "string" },
            organization_id: { type: "string", format: "uuid" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        FuelRecordInput: {
          type: "object",
          required: ["vehicle_id", "liters", "price_per_liter", "total_value", "odometer"],
          properties: {
            vehicle_id: { type: "string", format: "uuid" },
            driver_id: { type: "string", format: "uuid" },
            trip_id: { type: "string", format: "uuid" },
            fuel_date: { type: "string", format: "date-time" },
            liters: { type: "number", example: 400 },
            price_per_liter: { type: "number", example: 6.15 },
            total_value: { type: "number", example: 2460 },
            odometer: { type: "integer", example: 152000 },
            gas_station: { type: "string", example: "Posto Shell" },
            city: { type: "string", example: "Campinas" },
            state: { type: "string", example: "SP" },
            fuel_type: { type: "string", example: "diesel" },
            payment_method: { type: "string" },
            receipt_number: { type: "string" },
            notes: { type: "string" },
          },
        },
        Expense: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            vehicle_id: { type: "string", format: "uuid" },
            driver_id: { type: "string", format: "uuid" },
            trip_id: { type: "string", format: "uuid" },
            expense_type: { type: "string", example: "pedágio" },
            description: { type: "string", example: "Pedágio Rodovia dos Bandeirantes" },
            value: { type: "number", example: 45.8 },
            expense_date: { type: "string", format: "date-time" },
            due_date: { type: "string", format: "date" },
            supplier: { type: "string" },
            invoice_number: { type: "string" },
            payment_method: { type: "string" },
            status: { type: "string", enum: ["pending", "paid", "overdue"], example: "paid" },
            notes: { type: "string" },
            organization_id: { type: "string", format: "uuid" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        ExpenseInput: {
          type: "object",
          required: ["expense_type", "description", "value"],
          properties: {
            vehicle_id: { type: "string", format: "uuid" },
            driver_id: { type: "string", format: "uuid" },
            trip_id: { type: "string", format: "uuid" },
            expense_type: { type: "string", example: "pedágio" },
            description: { type: "string", example: "Pedágio BR-101" },
            value: { type: "number", example: 32.5 },
            expense_date: { type: "string", format: "date" },
            due_date: { type: "string", format: "date" },
            supplier: { type: "string" },
            invoice_number: { type: "string" },
            payment_method: { type: "string" },
            status: { type: "string", example: "pending" },
            notes: { type: "string" },
          },
        },
        MaintenanceRecord: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            vehicle_id: { type: "string", format: "uuid" },
            maintenance_type: { type: "string", example: "preventiva" },
            description: { type: "string", example: "Troca de óleo e filtros" },
            entry_date: { type: "string", format: "date-time" },
            exit_date: { type: "string", format: "date-time" },
            entry_km: { type: "integer" },
            exit_km: { type: "integer" },
            service_provider: { type: "string", example: "Oficina Central" },
            parts_cost: { type: "number" },
            labor_cost: { type: "number" },
            total_cost: { type: "number", example: 1200 },
            status: { type: "string", enum: ["scheduled", "in_progress", "completed"], example: "completed" },
            next_maintenance_date: { type: "string", format: "date" },
            next_maintenance_km: { type: "integer" },
            notes: { type: "string" },
            organization_id: { type: "string", format: "uuid" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        MaintenanceRecordInput: {
          type: "object",
          required: ["vehicle_id", "maintenance_type", "description", "entry_date"],
          properties: {
            vehicle_id: { type: "string", format: "uuid" },
            maintenance_type: { type: "string", example: "preventiva" },
            description: { type: "string", example: "Revisão geral 100.000 km" },
            entry_date: { type: "string", format: "date-time" },
            exit_date: { type: "string", format: "date-time" },
            entry_km: { type: "integer", example: 100000 },
            exit_km: { type: "integer" },
            service_provider: { type: "string", example: "Oficina Central" },
            parts_cost: { type: "number" },
            labor_cost: { type: "number" },
            total_cost: { type: "number" },
            status: { type: "string", example: "scheduled" },
            next_maintenance_date: { type: "string", format: "date" },
            next_maintenance_km: { type: "integer" },
            notes: { type: "string" },
          },
        },
      },
    },
  };
}
