/*
 * launchly-cart
 * https://github.com/craig/launchly-cart
 *
 * Copyright (c) 2013 Craig Sullivan
 * Licensed under the MIT license.
 */

/* List of methods
 *
 * add            
 * dec            
 * empty          
 * get 
 * update 
 * inc                    
 * remove                 
 * set                    
 * pay                    
 * payment_type_from_number */

/* List of events                                                                   */
/* --------------                                                                   */
/* cart.changed           the contents of the shopping cart has changed             */
/* cart.recieved          a new cart has been downloaded                            */
/* cart.payment.success   the order was successfully paid for                       */
/* cart.payment.failure   the payment was rejected and the order was not submitted  */
/* cart.price             a price check has been retrieved                          */

cart = {

	dec: function(element) {
		$.post("/{{ locale }}/__/cart/inc.json", cart.variant_data(element), function(data) {
			$(cart).trigger('cart.changed', [data]);
		});
	},

	/* empty the shopping cart */
	empty: function() {
		$.get("/{{ locale }}/__/cart/empty.json", { authenticity_token: rails_authenticity_token }, function(data) {
			$(cart).trigger('cart.empty', [data]);
		});
	},

	/* get the current shopping cart */
	get: function(element) {
		$.get("/{{ locale }}/__/cart.json", { authenticity_token: rails_authenticity_token }, function(data) { 
			$(cart).trigger('cart.changed', [data]);
		});
	},

	/* increment an item in the cart */
	inc: function(element) {
		$.post("/{{ locale }}/__/cart/inc.json", cart.variant_data(element), function(data) {
			$(cart).trigger('cart.changed', [data]);
		});
	},

	set: function(element) {
		$.post("/{{ locale }}/__/cart/set.json", cart.variant_data(element), function(data) {
			$(cart).trigger('cart.changed', [data]);
		});
	},

	item_id: function(element) {
		return element.data('item');
	},

	variant_id: function(item_id) {

		variant_id = $('#v_' + item_id + ' :selected').val();

		if (typeof variant_id == "undefined") {
			variant_id = $('#v_' + item_id).val();
		}

		return variant_id;
	},

	qty: function(item_id) {
		return $('#q_' + item_id).val();
	},

	variant_data: function(element) {

		i_id = cart.item_id(element);
		v_id = cart.variant_id(i_id);
		qty = cart.qty(i_id);

		data = {
			'authenticity_token': rails_authenticity_token,
			'v': []
		};

		data['v'].push(v_id);
		data['q_' + v_id] = qty;

		return data;
	},


	/* pay for an order */
	pay: function() {

		$.ajax({
			type: "POST",
			url: "{{ '/__/pay/cart.json' | secure_url }}",
			data: {
				'_launch_ly_session': $('#session_id').val(),
				'reference': $('#cart_reference').val(),
				'first_name': $('#card_first_name').val(),
				'last_name': $('#card_last_name').val(),
				'card_number': $('#card_number').val(),
				'payment_type': $('#payment_type').val(),
				'expires_month': $('#card_expires_month').val(),
				'expires_year': $('#card_expires_year').val(),
				'card_verification': $('#card_verification').val()			
			},
			success: function(data) { 
				$(cart).trigger('cart.payment.success', [data]);
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				response = $.parseJSON(XMLHttpRequest.responseText);
				$(cart).trigger('cart.payment.failed', [response]);
			}
		});

	},

	/* get a price check on an item */
	price: function(element) {

		i_id = cart.item_id(element);

		$.getJSON('/{{ locale }}/__/price_check/' + cart.variant_id(i_id) + '/' + cart.qty(i_id) + '.json',
			{ authenticity_token: rails_authenticity_token },
			function(data) { 
				$(cart).trigger('cart.price', [data]);
				$('#item_' + i_id + '_price').html(data.formatted_price); 
			}
		);

	},

	/* extract the payment type from the credit card number */
	payment_type_from_number: function(card_number) {	

		card_type = '';
		card_number = card_number.replace(/[^\d]/g,'');

		// see http://en.wikipedia.org/wiki/List_of_Bank_Identification_Numbers
		if (card_number.match(/^37\d{13}/)) { card_type = 'american_express'; }
		if (card_number.match(/^4\d{15}/) || card_number.match(/^4\d{12}/)) { card_type = 'visa'; }
		if (card_number.match(/^5[1-5]\d{14}$/)) { card_type = 'master'; }
		if (card_number.match(/^36\d{11}/)) { card_type = 'diners_club'; }	

		return card_type;	
	},	

	remove: function(element) {
		$.get("/{{ locale }}/__/cart/remove/" + element.data('variant') + ".json", function(data) {
			$(cart).trigger('cart.changed', [data]);
		});		
	},

	update: function(element) {
	}

};