const {admin,db} = require('./admin')

exports.FBauth = (req,res,next) => {
  const {authorization} = req.headers
  if(!authorization.startsWith('Bearer ')) return res.status(403).json({error:'unauthorized'})
  const token = authorization.split('Bearer ')[1]

  admin.auth().verifyIdToken(token)
    .then(decodedToken =>{
      let uid = decodedToken.uid
      return db.collection('users')
        .where('uid','==',uid)
        .limit(1)
        .get()
      })
    .then(snapshot => {
      req.username = snapshot.docs[0].data().username;
      req.image = snapshot.docs[0].data().imageUrl
      next()
    })
    .catch(err=>{
      console.error(err)
      return res.status(403).json({error:err.code})
    })
}