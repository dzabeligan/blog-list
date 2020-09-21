const _ = require('lodash')

// eslint-disable-next-line no-unused-vars
const dummy = (blogs) => 1

const totalLikes = (blogs) => {
  const reducer = (sum, blog) => {
    return sum + blog.likes
  }

  return blogs.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
  if (blogs.length === 0) return null
  // eslint-disable-next-line no-unused-vars
  const { _id, __v, url, ...maxBlog } = blogs.reduce((previousBlog, currentBlog) => previousBlog.likes > currentBlog.likes ? previousBlog : currentBlog)

  return maxBlog
}

const mostBlogs = (blogs) => {
  if (blogs.length === 0) return null
  const authorWithMostBlogs = _
    .chain(blogs)
    .countBy('author')
    .map((blogs, author) => ({ author, blogs }))
    .sortBy('blogs')
    .last()
    .value()
  return authorWithMostBlogs
}

const mostLikes = (blogs) => {
  if (blogs.length === 0) return null
  const authorWithMostLikes = _
    .chain(blogs)
    .groupBy('author')
    .map((obj, key) => ({ 'author': key, 'likes': _.sumBy(obj, 'likes') }))
    .sortBy('likes')
    .last()
    .value()
  return authorWithMostLikes
}

module.exports = { dummy, totalLikes, favoriteBlog, mostBlogs, mostLikes }
