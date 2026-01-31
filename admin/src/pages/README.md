# Pages Directory Structure

This directory contains all the page components for the admin panel, organized by feature/domain.

## Directory Structure

```
pages/
├── dashboard/          # Dashboard and analytics
│   └── Dashboard.jsx
├── products/          # Product management
│   ├── ProductAdd.jsx
│   ├── ProductList.jsx
│   ├── ProductDetails.jsx
│   ├── ProductVariant.jsx
│   ├── ProductDiscountPage.jsx
│   └── List.jsx
├── orders/            # Order management
│   ├── OrderList.jsx
│   └── OrderCreate.jsx
├── categories/        # Category and subcategory management
│   ├── CategoryManager.jsx
│   ├── SubCategoryManager.jsx
│   └── SubCategoryDetails.jsx
├── collections/       # Collection management
│   └── CollectionManager.jsx
├── discounts/         # Discount and promotion management
│   ├── DiscountManager.jsx
│   └── BulkDiscountPage.jsx
├── users/             # User and admin management
│   ├── UserList.jsx
│   └── AdminOperations.jsx
└── settings/          # Application settings
    └── Settings.jsx
```

## Organization Principles

### Feature-Based Structure
Pages are organized by business domain/feature rather than by type. This makes it easier to:
- Locate related functionality
- Understand the application structure
- Scale the codebase as features grow
- Maintain and refactor code

### Naming Conventions
- **Descriptive names**: Each file clearly indicates its purpose (e.g., `ProductList.jsx` instead of `List.jsx`)
- **Consistent patterns**: Similar pages follow similar naming patterns (e.g., `ProductList`, `OrderList`, `UserList`)
- **Manager suffix**: Used for pages that handle CRUD operations (e.g., `CategoryManager`, `CollectionManager`)

### Index Files
Each subdirectory includes an `index.js` file that exports all components. This enables cleaner imports:

```javascript
// Instead of:
import ProductList from './pages/products/ProductList';
import ProductAdd from './pages/products/ProductAdd';

// You can use:
import { ProductList, ProductAdd } from './pages/products';
```

## Migration Notes

### Renamed Files
The following files were renamed for clarity:
- `Add.jsx` → `products/ProductAdd.jsx`
- `List.jsx` → `products/List.jsx` (consider renaming to avoid confusion with ProductList)
- `Orders.jsx` → `orders/OrderList.jsx`
- `Users.jsx` → `users/UserList.jsx`
- `Category.jsx` → `categories/CategoryManager.jsx`

### Import Path Updates
All imports in `App.jsx` have been updated to reflect the new structure. If you have other files importing these pages, update them accordingly:

```javascript
// Old
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';

// New
import Dashboard from './pages/dashboard/Dashboard';
import OrderList from './pages/orders/OrderList';

// Or using index files
import { Dashboard } from './pages/dashboard';
import { OrderList } from './pages/orders';
```

## Future Improvements

### Potential Enhancements
1. **Rename `List.jsx`**: Consider renaming to `ProductListOld.jsx` or merging with `ProductList.jsx` to avoid confusion
2. **Shared components**: Create a `shared/` directory for components used across multiple features
3. **Page-specific components**: Consider creating component subdirectories within each feature (e.g., `products/components/`)
4. **Route configuration**: Extract route definitions to a separate config file for better maintainability

### Adding New Pages
When adding new pages:
1. Place them in the appropriate feature directory
2. Update the corresponding `index.js` file
3. Follow the existing naming conventions
4. Update this README if adding a new feature directory

## Related Documentation
- See `src/components/` for reusable UI components
- See `src/services/` for API service layers
- See `App.jsx` for routing configuration
