insert into public.categories(name,slug,description,sort_order,is_active)
values
 ('Tecnología','tecnologia','Accesorios y dispositivos tecnológicos',1,true),
 ('Hogar','hogar','Artículos prácticos para el hogar',2,true),
 ('Belleza','belleza','Cuidado personal y belleza',3,true),
 ('Moda','moda','Ropa, calzado y complementos',4,true),
 ('Accesorios','accesorios','Accesorios de uso diario',5,true),
 ('General','general','Productos de distintas categorías',6,true)
on conflict (slug) do nothing;
