import _ from 'underscore';

class Product {
	//id: integer,
	//price: float,
	//stockItems: integer,
	//name: string
}

class UpsellProduct extends Product {
	//upsellSpecifications: [UpsellAvailabalitySpecification]
}

class UpsellAvailabalitySpecification {
	//upsellProduct: UpsellProduct,
	//mainProduct: MainProduct
	//itemsInCart: integer, //items in cart of the mainProduct after upsell become available to be added in this cart
	//totalCartPrice: float //total cart amount of all product after upsell become available to be added in cart
}

class ShowUpsellPopup {
	//showUpsellInformation: function(upsell) {}
}

/**
 * core Shop class
 *
 */
export default class Shop {
}
