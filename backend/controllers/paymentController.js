// controllers/paymentController.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_your_test_key');
const { query } = require('../db');

// Obține configurația Stripe pentru checkout
exports.getStripeConfig = (req, res) => {
  try {
    res.status(200).json({
      success: true,
      publicKey: process.env.STRIPE_PUBLIC_KEY || 'pk_test_your_test_key'
    });
  } catch (error) {
    console.error('Eroare la obținerea configurației Stripe:', error);
    res.status(500).json({ success: false, message: 'Eroare la obținerea configurației' });
  }
};

// Obține planurile de abonament pentru pagina de plată
exports.getPlans = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM subscription_plans WHERE active = true ORDER BY price ASC'
    );
    
    res.status(200).json({ 
      success: true, 
      plans: result.rows 
    });
  } catch (error) {
    console.error('Eroare la obținerea planurilor:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Eroare la obținerea planurilor de abonament' 
    });
  }
};

// Creează Payment Intent pentru Stripe Elements
exports.createPaymentIntent = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;
    
    if (!planId) {
      return res.status(400).json({ success: false, message: 'ID-ul planului este necesar' });
    }

    // Obține detaliile planului
    const planResult = await query(
      'SELECT * FROM subscription_plans WHERE id = $1 AND active = true',
      [planId]
    );
    
    if (planResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Planul nu a fost găsit' });
    }

    const plan = planResult.rows[0];

    // Verifică dacă utilizatorul are deja un abonament activ
    const existingSubscription = await query(
      'SELECT * FROM user_subscriptions WHERE user_id = $1 AND end_date > NOW() AND status = $2',
      [userId, 'active']
    );

    if (existingSubscription.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Aveți deja un abonament activ' 
      });
    }

    // Creează Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(plan.price * 100), // Convertește în cenți
      currency: 'ron',
      metadata: {
        user_id: userId.toString(),
        plan_id: planId.toString(),
        plan_name: plan.name
      }
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Eroare la crearea Payment Intent:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Eroare la procesarea plății' 
    });
  }
};

// Confirmă plata și activează abonamentul
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.id;
    
    if (!paymentIntentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID-ul Payment Intent este necesar' 
      });
    }

    // Obține Payment Intent de la Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Plata nu a fost finalizată cu succes'
      });
    }

    const planId = paymentIntent.metadata.plan_id;
    
    // Obține detaliile planului
    const planResult = await query(
      'SELECT * FROM subscription_plans WHERE id = $1',
      [planId]
    );
    
    if (planResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Planul nu a fost găsit' 
      });
    }
    
    const plan = planResult.rows[0];

    // Calculează datele de început și sfârșit
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration_days);

    // Inserează abonamentul utilizatorului
    const subscriptionResult = await query(`
      INSERT INTO user_subscriptions (user_id, plan_id, start_date, end_date, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [userId, planId, startDate, endDate, 'active']);

    const userSubscriptionId = subscriptionResult.rows[0].id;

    // Inserează înregistrarea plății
    await query(`
      INSERT INTO payments (user_id, subscription_id, amount, payment_method, payment_id, status)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      userId,
      userSubscriptionId,
      paymentIntent.amount / 100, // Convertește din cenți
      'card',
      paymentIntentId,
      'completed'
    ]);

    // Obține detaliile complete ale abonamentului pentru response
    const newSubscriptionResult = await query(`
      SELECT us.*, sp.name as subscription_name, sp.features
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.id = $1
    `, [userSubscriptionId]);

    res.status(200).json({
      success: true,
      message: 'Abonamentul a fost activat cu succes',
      subscription: newSubscriptionResult.rows[0]
    });
  } catch (error) {
    console.error('Eroare la confirmarea plății:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Eroare la procesarea plății' 
    });
  }
};

// Webhook pentru procesarea evenimentelor de la Stripe
exports.handleWebhook = async (req, res) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Procesează evenimentele
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const userSubscriptionId = session.metadata.user_subscription_id;
      
      // Actualizează statusul abonamentului
      try {
        await query(
          'UPDATE user_subscriptions SET status = $1, updated_at = NOW() WHERE id = $2',
          ['active', userSubscriptionId]
        );
        
        // Inserează înregistrarea plății
        await query(`
          INSERT INTO payments (user_id, subscription_id, amount, payment_method, payment_id, status)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          session.metadata.user_id,
          userSubscriptionId,
          session.amount_total / 100,
          'card',
          session.payment_intent,
          'completed'
        ]);
        
        console.log(`Plată completă pentru abonamentul #${userSubscriptionId}`);
      } catch (err) {
        console.error('Eroare la actualizarea statusului abonamentului:', err);
      }
      break;
      
    case 'payment_intent.payment_failed':
      const failedPaymentIntent = event.data.object;
      console.log('Plată eșuată:', failedPaymentIntent.id);
      
      // Poți adăuga logică pentru plăți eșuate
      try {
        await query(`
          UPDATE user_subscriptions 
          SET status = $1, updated_at = NOW() 
          WHERE plan_id = $2 AND user_id = $3 AND status = $4
        `, ['failed', failedPaymentIntent.metadata.plan_id, failedPaymentIntent.metadata.user_id, 'pending']);
      } catch (err) {
        console.error('Eroare la actualizarea statutului plății eșuate:', err);
      }
      break;
      
    default:
      console.log(`Eveniment neprocesat: ${event.type}`);
  }

  res.status(200).json({ received: true });
};

// Verifică statusul plății
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'ID-ul sesiunii este necesar' });
    }

    // Obține sesiunea de la Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    res.status(200).json({
      success: true,
      paymentStatus: session.payment_status,
      subscription: {
        id: session.metadata?.plan_id,
        userSubscriptionId: session.metadata?.user_subscription_id
      }
    });
  } catch (error) {
    console.error('Eroare la verificarea statusului plății:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Eroare la verificarea statusului plății' 
    });
  }
};

// Obține istoricul plăților utilizatorului
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await query(`
      SELECT p.*, sp.name as plan_name
      FROM payments p
      JOIN user_subscriptions us ON p.subscription_id = us.id
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
    `, [userId]);
    
    res.status(200).json({
      success: true,
      payments: result.rows
    });
  } catch (error) {
    console.error('Eroare la obținerea istoricului plăților:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la obținerea istoricului plăților'
    });
  }
};