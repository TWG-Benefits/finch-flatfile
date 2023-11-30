export type Customer = {
    created_at: string
    customer_name: string
    finch_connect_url: string | null
    id: string
    plan_id: number
}

export type Connection = {
    account_id: string | null
    company_id: string
    created_at: string
    customer_id: string
    finch_access_token: string
    id: string
    last_processed_payment: string | null
    provider_id: string
}

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            connections: {
                Row: {
                    account_id: string | null
                    company_id: string
                    created_at: string
                    customer_id: string
                    finch_access_token: string
                    id: string
                    last_processed_payment: string | null
                    provider_id: string
                }
                Insert: {
                    account_id?: string | null
                    company_id: string
                    created_at?: string
                    customer_id: string
                    finch_access_token: string
                    id?: string
                    last_processed_payment?: string | null
                    provider_id: string
                }
                Update: {
                    account_id?: string | null
                    company_id?: string
                    created_at?: string
                    customer_id?: string
                    finch_access_token?: string
                    id?: string
                    last_processed_payment?: string | null
                    provider_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "connections_customer_id_fkey"
                        columns: ["customer_id"]
                        isOneToOne: false
                        referencedRelation: "customers"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "customerId_fkey"
                        columns: ["customer_id"]
                        isOneToOne: false
                        referencedRelation: "customers"
                        referencedColumns: ["id"]
                    }
                ]
            }
            customers: {
                Row: {
                    created_at: string
                    customer_name: string
                    finch_connect_url: string | null
                    id: string
                    plan_id: number
                }
                Insert: {
                    created_at?: string
                    customer_name?: string
                    finch_connect_url?: string | null
                    id?: string
                    plan_id?: number | null
                }
                Update: {
                    created_at?: string
                    customer_name?: string | null
                    finch_connect_url?: string | null
                    id?: string
                    plan_id?: number | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
