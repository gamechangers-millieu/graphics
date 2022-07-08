/**
 *
 * TSoaP Graphics Processor
 *
 */

const get = require("lodash/get")
const has = require("lodash/has")

const axios = require("axios")
const fs = require("fs")

const express = require("express")
const cors = require("cors")
const app = express()
app.use(cors())
const port = 3344

const spritesheet = require("spritesheet-js")

const bodyParser = require("body-parser")
const jsonParser = bodyParser.json()

const getPixels = require("get-pixels")
const pm2 = require("pm2")

const sanity = require("@sanity/client")
const imageUrlBuilder = require("@sanity/image-url")
const client = sanity({
  projectId: "i6bqtajk",
  dataset: "production",
  token:
    "skMtHpLm8VAKozjxvM5WvSXFajlCxRVxt5GtYba2JAfIHy8rk03ImJd7NgxZuyPq7YPU3UAZsxnfXmghbgggAVQKuJb3ZFvJVFFbKGowG1opzhcCgP5wIeAIYr6G0F63fgvPBxAA3Fx2vMNbvFncZjSYM2J8w1DXTA4IhbYK1UdCEXGyKLaJ",
  useCdn: false,
})

const builder = imageUrlBuilder(client)

const OUTPUT_PATH = "output/"

const urlFor = (source) => builder.image(source)

let allowCrossDomain = function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "*")
  next()
}
app.use(allowCrossDomain)

app.post("/avatar", jsonParser, (req, res) => {
  const body = req.body
  const NAME = body._id + "_" + Date.now()
  let animations = {
    rest: [],
    front: [],
    back: [],
    left: [],
    right: [],
  }

  fs.mkdir(OUTPUT_PATH + NAME, (e) => {
    const downloadImages = (list, label) => {
      let innerList = []

      list.forEach((frame, index) => {
        // console.log(frame.asset)
        let url = urlFor(frame.asset).url()
        // console.log(url)

        let downloadPromise = axios({
          method: "get",
          url: url,
          responseType: "stream",
        })

        innerList.push(downloadPromise)

        downloadPromise.then((response) => {
          let filename = label + "-" + index + ".png"
          let w = fs.createWriteStream(OUTPUT_PATH + NAME + "/" + filename)
          response.data.pipe(w)
          w.on("finish", () => {
            console.log("Avatar downloaded")
            animations[label].push(filename)
          })
        })
      })

      return innerList
    }

    let promiseList = []

    promiseList = [...promiseList, ...downloadImages(body.rest, "rest")]
    promiseList = [...promiseList, ...downloadImages(body.front, "front")]
    promiseList = [...promiseList, ...downloadImages(body.back, "back")]
    promiseList = [...promiseList, ...downloadImages(body.left, "left")]
    promiseList = [...promiseList, ...downloadImages(body.right, "right")]

    console.dir(promiseList)

    Promise.all(promiseList).then((values) => {
      console.dir("all downloaded")

      spritesheet(
        OUTPUT_PATH + NAME + "/*.png",
        { format: "json", name: NAME, path: OUTPUT_PATH + NAME },
        (err) => {
          if (err) throw err

          console.log("spritesheet successfully generated")

          client.assets
            .upload(
              "image",
              fs.createReadStream(OUTPUT_PATH + NAME + "/" + NAME + ".png")
            )
            .then((imgRes) => {
              const rawdata = fs.readFileSync(
                OUTPUT_PATH + NAME + "/" + NAME + ".json"
              )
              const ss = JSON.parse(rawdata.toString())
              ss.animations = animations
              ss.meta.image = imgRes.url

              let imageDoc = {
                _type: "image",
                asset: {
                  _type: "reference",
                  _ref: imgRes._id,
                },
              }

              fs.writeFile(
                OUTPUT_PATH + NAME + "/" + NAME + ".json",
                JSON.stringify(ss),
                (err) => {
                  if (err) return console.log(err)

                  client.assets
                    .upload(
                      "file",
                      fs.createReadStream(
                        OUTPUT_PATH + NAME + "/" + NAME + ".json"
                      ),
                      { filename: NAME + ".json" }
                    )
                    .then((jsonRes) => {
                      let jsonDoc = {
                        _type: "file",
                        asset: {
                          _type: "reference",
                          _ref: jsonRes._id,
                        },
                      }

                      client
                        .patch(body._id)
                        .set({ spritesheet: imageDoc, spriteJson: jsonDoc })
                        .commit()

                      res.json(ss)
                    })
                }
              )
            })
        }
      )
    })
  })
})

app.post("/case-study", jsonParser, (req, res) => {
  const body = req.body
  const NAME = body._id + "_" + Date.now()
  let animations = {
    frames: [],
  }

  fs.mkdir(OUTPUT_PATH + NAME, (e) => {
    const downloadImages = (list, label) => {
      let innerList = []

      list.forEach((frame, index) => {
        // console.log(frame.asset)
        let url = urlFor(frame.asset).url()
        // console.log(url)

        let downloadPromise = axios({
          method: "get",
          url: url,
          responseType: "stream",
        })

        innerList.push(downloadPromise)

        downloadPromise.then((response) => {
          let filename = label + "-" + index + ".png"
          let w = fs.createWriteStream(OUTPUT_PATH + NAME + "/" + filename)
          response.data.pipe(w)
          w.on("finish", () => {
            console.log("Avatar downloaded")
            animations[label].push(filename)
          })
        })
      })

      return innerList
    }

    let promiseList = []

    promiseList = [...promiseList, ...downloadImages(body.frames, "frames")]

    console.dir(promiseList)

    Promise.all(promiseList).then((values) => {
      console.dir("all downloaded")

      spritesheet(
        OUTPUT_PATH + NAME + "/*.png",
        { format: "json", name: NAME, path: OUTPUT_PATH + NAME },
        (err) => {
          if (err) throw err

          console.log("spritesheet successfully generated")

          client.assets
            .upload(
              "image",
              fs.createReadStream(OUTPUT_PATH + NAME + "/" + NAME + ".png")
            )
            .then((imgRes) => {
              const rawdata = fs.readFileSync(
                OUTPUT_PATH + NAME + "/" + NAME + ".json"
              )
              const ss = JSON.parse(rawdata.toString())
              ss.animations = animations
              ss.meta.image = imgRes.url

              let imageDoc = {
                _type: "image",
                asset: {
                  _type: "reference",
                  _ref: imgRes._id,
                },
              }

              fs.writeFile(
                OUTPUT_PATH + NAME + "/" + NAME + ".json",
                JSON.stringify(ss),
                (err) => {
                  if (err) return console.log(err)

                  client.assets
                    .upload(
                      "file",
                      fs.createReadStream(
                        OUTPUT_PATH + NAME + "/" + NAME + ".json"
                      ),
                      { filename: NAME + ".json" }
                    )
                    .then((jsonRes) => {
                      let jsonDoc = {
                        _type: "file",
                        asset: {
                          _type: "reference",
                          _ref: jsonRes._id,
                        },
                      }

                      client
                        .patch(body._id)
                        .set({ spritesheet: imageDoc, spriteJson: jsonDoc })
                        .commit()

                      res.json(ss)
                    })
                }
              )
            })
        }
      )
    })
  })
})

app.post("/grid", jsonParser, (req, res) => {
  const body = req.body

  let url = urlFor(body.pathfindingGrid.asset).url()

  axios({
    method: "get",
    url: url,
    responseType: "stream",
  }).then((response) => {
    let filename = "grid-" + Date.now() + ".png"
    let w = fs.createWriteStream(OUTPUT_PATH + "/" + filename)
    response.data.pipe(w)
    w.on("finish", () => {
      console.log("Grid file downloaded")
      // open grid
      function listToMatrix(list, elementsPerSubArray) {
        var matrix = [],
          i,
          k

        for (i = 0, k = -1; i < list.length; i++) {
          if (i % elementsPerSubArray === 0) {
            k++
            matrix[k] = []
          }
          matrix[k].push(list[i])
        }

        return matrix
      }

      getPixels(OUTPUT_PATH + "/" + filename, function (err, pixels) {
        if (err) {
          console.log("Bad image path")
          return
        }

        const WIDTH = pixels.shape.slice()[0]
        const HEIGHT = pixels.shape.slice()[1]
        const CHANNELS = pixels.shape.slice()[2]

        console.log("WIDTH:", WIDTH)
        console.log("HEIGHT:", HEIGHT)
        console.log("CHANNELS:", CHANNELS)

        let dividedInPixels = listToMatrix(pixels.data, CHANNELS)

        //   console.dir(dividedInPixels)
        let to2D = listToMatrix(dividedInPixels, WIDTH)

        // convert
        let matrix = []
        for (let row = 0; row < HEIGHT; row++) {
          matrix.push([])

          for (let col = 0; col < WIDTH; col++) {
            let currentPx = to2D[row][col]
            let newPx = 1

            if (
              currentPx[0] == 255 &&
              currentPx[1] == 255 &&
              currentPx[2] == 255
            ) {
              // console.log('white')
              newPx = 0
            } else if (
              currentPx[0] == 255 &&
              currentPx[1] == 255 &&
              currentPx[2] == 0
            ) {
              // console.log('yellow')
              newPx = 2
            } else if (
              currentPx[0] == 255 &&
              currentPx[1] == 0 &&
              currentPx[2] == 0
            ) {
              // console.log('red')
              newPx = 3
            } else if (
              currentPx[0] == 0 &&
              currentPx[1] == 255 &&
              currentPx[2] == 0
            ) {
              // console.log('green')
              newPx = 4
            } else if (
              currentPx[0] == 0 &&
              currentPx[1] == 0 &&
              currentPx[2] == 255
            ) {
              // console.log('blue')
              newPx = 0
            } else {
              // console.log('black')
              newPx = 1
            }

            matrix[row].push(newPx)
          }
        }

        // save json
        fs.writeFile(
          "../tsoap-gameserver/grid.json",
          JSON.stringify({ data: matrix }),
          (err) => {
            if (err) throw err
            console.log("Data written to file")

            //reload server
            pm2.connect(function (err) {
              if (err) {
                console.error(err)
                process.exit(2)
              }

              pm2.restart(5, (err, proc) => {
                if (err) {
                  console.error(err)
                }
                console.dir(proc)
                // return
                res.json(JSON.stringify({ status: "OK" }))
              })
            })
          }
        )
      })
    })
  })
})

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`)
})
