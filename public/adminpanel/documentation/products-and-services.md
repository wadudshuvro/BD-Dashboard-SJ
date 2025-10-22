# Products & Services Catalog

## Overview
The Products & Services module provides centralized management of SJ Innovation's service offerings within the Admin Panel. Designed for reusability across white-label platforms (CollabAI SaaS, LeadLift).

## Database Schema

### `products` Table
- `id` (UUID): Primary key
- `name` (TEXT): Product/service name
- `category` (TEXT): Service category
- `description` (TEXT): Detailed description
- `target_industries` (TEXT[]): Array of target industries
- `owner_team` (UUID): Responsible team/pod
- `pricing_model` (TEXT): Pricing structure
- `is_active` (BOOLEAN): Active status
- `google_drive_link` (TEXT): Documentation link
- `marketing_variant_link` (TEXT): Marketing materials
- `created_at`, `updated_at`: Timestamps

## Default SJ Services

| Name | Category | Target Industry | Owner Team |
|------|----------|----------------|------------|
| OpenAI & ChatGPT Solutions | AI Development | Tech, Finance, Healthcare | BuildYourAI |
| Mobile App Development | App Engineering | Multiple sectors | Dev Team |
| AWS Cloud & DevOps Services | Infrastructure | Enterprise, SMB | CloudOps |
| Shopify E-Commerce Development | E-Commerce | Retail, D2C | Commerce Team |
| Custom Software & QA Testing | Software Development | All verticals | Engineering |

## Edge Functions

### `admin-products` (CRUD Operations)
- `GET` - List all products (paginated)
- `POST` - Create new product
- `PUT` - Update product
- `DELETE` - Archive product

## Feature Flags

### `ai_configurations` Table
```json
{
  "configuration_type": "feature_flags",
  "configuration_data": {
    "products_enabled": true,
    "products_public_listing": false
  }
}
```

## Admin Usage

### Add New Product
1. Navigate to `/adminpanel/strategy/products`
2. Click "Add Product"
3. Fill in details (name, category, description, target industries)
4. Assign owner team
5. Add external links (Google Drive, marketing materials)
6. Save

### Edit Product
1. Click on product in DataTable
2. Modify fields in drawer
3. Save changes

### Archive Product
1. Find product in list
2. Click "Archive" button
3. Confirm action

## Review Checklist
- ☑ All 5 SJ services added to database
- ☑ Products visible in Admin Panel
- ☑ CRUD operations working
- ☑ Feature flags configured
- ☑ RLS policies in place
- ☑ Documentation complete
