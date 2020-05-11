import express from 'express';
import multer from 'multer';
import { Text, Word } from '@models';
import { processTexts } from '@processing';
import { isObjectEmpty } from '@utils';

const router = express.Router();
const upload = multer();

export default router
  .get('/', async (req, res) => {
    try {
      const items = await Text.findAll();

      return res
        .status(200)
        .json(items)

    } catch(error) {

      return res
        .status(500)
        .json({ error })
    }
  })
  .get('/:id', async (req, res) => {
    const { 
      params: { id: textId }
    } = req
    try {
      const item = await Text.findByPk(textId);
      
      return res
        .status(200)
        .json(item)
    
      } catch(error) {
      
      return res
        .status(500)
        .json({ error })
    }
  })
  .post('/', async (req, res) => {
    const { body } = req;
    let item;
    try {
      //TODO: Filter fields
      item = await Text.create(body);
      item = await item.save();
    } catch(e) {
      return res
        .status(500)
        .json({ msg: e })
    }

    return res
      .status(201)
      .json(item);
  })
  .put('/:id', (req, res) => {

  })
  .delete('/:id', (req, res) => {

  })
  .post('/:id/content', upload.single('rawContent'),  async (req, res) => {
    const { 
      file, 
      body: { textId } 
    } = req;

    try {
      let item = await Text.findByPk(textId);
      item = await item.update({
        rawContent: file.buffer.toString('utf-8')
      });

      return res
        .status(200)
        .json(item)
    } catch (error) {
      
      return res
        .status(500)
        .json({ error })
    }
  })
  .post('/:id/process', async (req, res) => {
    const {
      params: { id: textId }
    } = req

    try {
      const item = await Text.findByPk(textId);
      if(item === null)
        return res
          .status(404)
          .json({ msg: 'Texto no encontrado'})
      
      if(item.status === 'PROCESSED' || !item.rawContent) {
        return res
          .status(500)
          .json({ msg: 'Este texto ya fue procesado o el contenido no ha sido proporcionado'});
      } 

      const texts = await Text.getTextsToProcess(item.textId);
      const processed = await processTexts(texts);
      const conflicts = await Word.compareBeforeSaving(
        processed.find(processed => processed.textId === Number(textId)).essentialWords
      );
      return res
        .status(200)
        .json({textId, ...conflicts});
    } catch (error) {
      return res
        .status(500)
        .json(error)
    }
  })
  .post('/:id/process/save', async (req, res) => {
    const {
      body: {
        conflicts,
        ready
      },
      params: { id: textId }
    } = req

    if(!isObjectEmpty(conflicts))
      return res
        .status(400)
        .json({msg: 'No es posible guardar si aún existen conflictos'})
    
    try {
      const saved = await Word.saveChoosen(ready);

      return res
        .status(200)
        .json(saved);
    } catch (error) {
      return res
        .status(500)
        .json(error)
    }
  })