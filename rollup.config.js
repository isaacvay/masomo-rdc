import replace from '@rollup/plugin-replace';

export default {
  plugins: [
    replace({
      preventAssignment: true, // Active l'option recommandée
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
  ],
};