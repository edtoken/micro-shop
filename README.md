Техническое задание 

Есть product двух типов:
a) MainProduct extends Product
б) UpsellProduct extends Product

Для каждого товара из группы Main существует UpsellSpecification объект.

Product {
   id: integer,
   price: float,
   stockItems: integer,
   name: string
}

UpsellProduct extend Product {
   upsellSpecifications: [UpsellAvailabalitySpecification]
}

Каждый объект из группы main может иметь связь к объектам upsell product через UpsellAvailabalitySpecification.

Два разных MainProduct могут иметь связь с одним и тем же upsellProduct через разные UpsellAvailabalitySpecification

UpsellAvailabalitySpecification {
upsellProduct: UpsellProduct,
mainProduct: MainProduct
itemsInCart: integer, //items in cart of the mainProduct after upsell become available to be added in this cart
totalCartPrice: float //total cart amount of all product after upsell become available to be added in cart
}

Задание: спроектировать объект Cart, соответствующий следующим требованиям:
1) Метод добавления продукта в корзину с указанием quantity.
2) Метод удаления продукта
3) Метод изменения quantity продукта.
4) Корзина не должна давать возможности добавлять конкретный UpsellProduct до момента пока корзина не соответствует условиям соответствующего UpsellAvailabalitySpecification
5) UpsellProduct может добавляться только с quantity = 1
6) При достижении Cart требований одного из UpsellAvailabalitySpecification, должен срабатывать триггер и вызываться подписчик ShowUpsellPopup.showUpsellInformation(upsell), но только
если upsell еще не добавлен в Cart

ShowUpsellPopup {
showUpsellInformation: function(upsell) {}
}

7) В любой момент времени объект Cart должен находиться в валидном состоянии.
8) Реализовать метод sync() для синхронизации с сервером.

