import { UUID } from 'crypto';
import { Url } from 'url';

type Customer = {
    id: UUID,
    customer_name: string,
    plan_id: number,
    finch_connect_url: Url,
    created_at: EpochTimeStamp
}

type Connection = {
    id: UUID,
    customer_id: UUID,
    company_id: UUID,
    provider_id: string,
    account_id: UUID,
    finch_access_token: UUID,
    last_processed_payment: UUID,
    created_at: EpochTimeStamp
}
