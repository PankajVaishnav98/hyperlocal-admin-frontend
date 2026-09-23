import { Route, Routes } from 'react-router-dom'

import { RequireAuth } from '../features/auth/RequireAuth'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { CategoriesPage } from '../pages/CategoriesPage'
import { CategoryFormPage } from '../pages/CategoryFormPage'
import { DashboardPage } from '../pages/DashboardPage'
import { HomeBannerFormPage } from '../pages/HomeBannerFormPage'
import { HomeBannersPage } from '../pages/HomeBannersPage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { OrdersPage } from '../pages/OrdersPage'
import { OrderDetailPage } from '../pages/OrderDetailPage'
import { ProductFormPage } from '../pages/ProductFormPage'
import { ProductsPage } from '../pages/ProductsPage'
import { ServiceAreaFormPage } from '../pages/ServiceAreaFormPage'
import { ServiceAreasPage } from '../pages/ServiceAreasPage'
import { SessionsPage } from '../pages/SessionsPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="categories/new" element={<CategoryFormPage />} />
          <Route path="categories/:categoryId" element={<CategoryFormPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/new" element={<ProductFormPage />} />
          <Route path="products/:productId" element={<ProductFormPage />} />
          <Route path="home-banners" element={<HomeBannersPage />} />
          <Route path="home-banners/new" element={<HomeBannerFormPage />} />
          <Route path="home-banners/:bannerId" element={<HomeBannerFormPage />} />
          <Route path="service-areas" element={<ServiceAreasPage />} />
          <Route path="service-areas/new" element={<ServiceAreaFormPage />} />
          <Route path="service-areas/:serviceAreaId" element={<ServiceAreaFormPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="orders/:orderId" element={<OrderDetailPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
