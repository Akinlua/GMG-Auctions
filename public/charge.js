

        

    // const checkoutButton = document.getElementById('checkout-button');
    // const item_id = document.getElementById('item_id');
    // console.log(checkoutButton)
    // console.log(item_id)


    // checkoutButton.addEventListener('click', async () => {
        
    // try{
    //     const item_id = document.getElementById('item_id').value
    //     const response = await fetch(`/create-checkout-session/${item_id}`, { method: 'POST' });
    //     console.log(response)
    //     const session = await response.json();
    //     console.log("session: ", session)
        
    //     // Redirect the user to the Stripe Checkout page
    //     const result = await stripe.redirectToCheckout({
    //         sessionId: session.id,
    //     });

    //     console.log(result)

    //     if (result.error) {
    //         console.error('Failed to redirect to Checkout:', result.error);
    //         document.getElementById("error_message").textContent = "There was an error in process of payment contact admin or check internet connection"
    //     }
    // } catch (error) {
    //     console.log(error)
    //     document.getElementById("error_message").textContent = "There was an error, check your internet connection or contact admin"
    // }

    // });

    const stripe = Stripe(stripePublickey)
    
    const elements = stripe.elements();
    
    const cardElement = stripe.elements().create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#32325d',
          '::placeholder': {
            color: '#aab7c4',
          },
        },
        invalid: {
          color: '#fa755a',
        },
      },
    });
    
    cardElement.mount('#card-element');
    
    const form = document.getElementById('payment-form');

    // on submit
    form.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const { token, error } = await stripe.createToken(cardElement);
    
    if (error) {
      const errorElement = document.getElementById('card-errors');
      errorElement.textContent = error.message;
    } else {
      const hiddenInput = document.createElement('input');
      hiddenInput.setAttribute('type', 'hidden');
      hiddenInput.setAttribute('name', 'token');
      hiddenInput.setAttribute('value', token.id);
    
      form.appendChild(hiddenInput);
      form.submit();
    }
    });
    
    

