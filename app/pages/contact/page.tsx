"use client";
import { useForm } from 'react-hook-form';
import Footer from "@/app/components/footer/Footer";
import FAQ from "../../components/homeComp/faq/FAQ";
import React from 'react';
import { motion } from 'framer-motion';

const Contact = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<IContactForm>();

  interface IContactForm {
    name: string;
    email: string;
    message: string;
  }

  const onSubmit = async (data: IContactForm): Promise<void> => {
    try {
      // Simulation d'envoi d'API
      console.log('Data submitted:', data);
      reset();
    } catch (error: unknown) {
      console.error('Submission error:', error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <>
      <motion.section 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="py-12 bg-gray-50 dark:bg-gray-900 pt-36"
      >
        <div className="container mx-auto px-4 w-[90%] max-w-7xl">
          
          {/* Section Réclamations et FAQ */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-16">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                Réclamations et foires aux questions
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Consultez nos FAQ pour obtenir des réponses rapides à vos questions courantes.
              </p>
            </div>
            <div className="flex justify-center">
              <img
                src="/images/logop.png"
                alt=""
                loading="lazy"
                className="w-full max-w-md h-auto rounded-2xl shadow-xl transform hover:scale-[1.02] transition-transform duration-300"
                width={600}
                height={400}
              />
            </div>
          </motion.div>

          {/* Section FAQ */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-16">
            <div className="space-y-6">
              <FAQ />
            </div>
            <div className="flex justify-center order-first md:order-last">
              <img
                src="/images/question.png"
                alt=""
                loading="lazy"
                className="w-full max-w-md h-auto rounded-2xl shadow-xl"
                width={600}
                height={400}
              />
            </div>
          </motion.div>

          {/* Section Contact */}
          <motion.div variants={itemVariants} className="mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white text-center mb-12">
              Contactez-nous
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Formulaire */}
              <motion.form 
                onSubmit={handleSubmit(onSubmit)}
                className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl"
              >
                <div className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nom complet
                    </label>
                    <input
                      {...register('name', { required: 'Ce champ est obligatoire' })}
                      id="name"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 dark:bg-gray-700 dark:text-white transition-colors"
                      placeholder="Votre nom"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Adresse e-mail
                    </label>
                    <input
                      {...register('email', { 
                        required: 'Ce champ est obligatoire',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Adresse email invalide'
                        }
                      })}
                      id="email"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 dark:bg-gray-700 dark:text-white transition-colors"
                      placeholder="votre@email.com"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Message
                    </label>
                    <textarea
                      {...register('message', { 
                        required: 'Ce champ est obligatoire',
                        minLength: {
                          value: 30,
                          message: 'Minimum 30 caractères'
                        }
                      })}
                      id="message"
                      rows={5}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 dark:bg-gray-700 dark:text-white transition-colors"
                      placeholder="Écrivez votre message ici..."
                    ></textarea>
                    {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    Envoyer le message
                  </button>
                </div>
              </motion.form>

              {/* Informations de contact */}
              <div className="space-y-8">
                <ContactCard 
                  title="Coordonnées"
                  items={[
                    { icon: 'map', text: 'Kolwezi, Lualaba, République Démocratique du Congo' },
                    { icon: 'phone', text: '+243 83 581 6126'},
                    { icon: 'mail', text: 'contact@masomo.com' }
                  ]}
                />

                <ContactCard 
                  title="Réseaux sociaux"
                  social={[
                    { name: 'Facebook', icon: 'facebook', url: '#' },
                    { name: 'X', icon: 'X', url: '#' },
                    { name: 'LinkedIn', icon: 'linkedin', url: '#' },
                    { name: 'Instagram', icon: 'instagram', url: '#' }
                  ]}
                />

                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Heures d'ouverture</h3>
                  <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                    <li className="flex justify-between">
                      <span>Lundi - Vendredi</span>
                      <span>9h - 18h</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Samedi</span>
                      <span>10h - 16h</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Dimanche</span>
                      <span>Fermé</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>
      
      <Footer />
    </>
  );
};

const ContactCard = ({ title, items, social = [] }: { title: string; items?: { icon: string; text: string }[]; social?: { name: string; icon: string; url: string }[] }) => (
  <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
    
    {items && (
      <ul className="space-y-4">
        {items.map((item, index) => (
          <li key={index} className="flex items-start space-x-3">
            <span className="text-cyan-600 dark:text-cyan-400">
              <ContactIcon icon={item.icon as "map" | "phone" | "mail"} />
            </span>
            <span className="text-gray-600 dark:text-gray-400">{item.text}</span>
          </li>
        ))}
      </ul>
    )}

    {social.length > 0 && (
      <div className="flex space-x-4 mt-6">
        {social.map((platform, index) => (
          <a
            key={index}
            href={platform.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
            aria-label={platform.name}
          >
            <SocialIcon icon={platform.icon as "facebook" | "X" | "linkedin" | "instagram"} />
          </a>
        ))}
      </div>
    )}
  </div>
);

const ContactIcon = ({ icon }: { icon: "map" | "phone" | "mail" }) => {
  const icons = {
    map: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z',
    phone: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
    mail: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  };

  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[icon]} />
    </svg>
  );
};

const SocialIcon = ({ icon }: { icon: "facebook" | "X" | "linkedin" | "instagram" }) => {
  const icons: { [key in "facebook" | "X" | "linkedin" | "instagram"]: string } = {
    facebook: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z',
    X: 'M6 18L18 6M6 6l12 12',
    linkedin: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z',
    instagram: 'M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 011.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772 4.915 4.915 0 01-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 100 10 5 5 0 000-10zm6.5-.25a1.25 1.25 0 00-2.5 0 1.25 1.25 0 002.5 0zM12 9a3 3 0 110 6 3 3 0 010-6z',
  };

  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[icon]} />
    </svg>
  );
};

export default Contact;
