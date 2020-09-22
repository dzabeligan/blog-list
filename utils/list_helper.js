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
  const { _id, __v, url, ...maxBlog } = blogs.reduce(
    (previousBlog, currentBlog) => {
      return (
        previousBlog.likes > currentBlog.likes
          ? previousBlog
          : currentBlog
      )
    })

  return maxBlog
}

const mostBlogs = (blogs) => {
  if (blogs.length === 0) {
    return null
  }

  const blogsByAuthor = _.toPairs(_.groupBy(blogs, b => b.author))
  const blockCountByAuthor = blogsByAuthor.map(([author, blogs]) => ({
    author,
    blogs: blogs.length
  }) ).sort((a1, a2 ) => a2.blogs - a1.blogs)

  return blockCountByAuthor[0]
}

const mostLikes = (blogs) => {
  if ( blogs.length === 0) {
    return null
  }

  const blogsByAuthor = _.toPairs(_.groupBy(blogs, b => b.author))
  const likeCountByAuthor = blogsByAuthor.map(([author, blogs]) => ({
    author,
    likes: blogs.reduce((s, b) => s + b.likes, 0)
  }) ).sort((a1, a2 ) => a2.likes - a1.likes)

  return likeCountByAuthor[0]
}

module.exports = { dummy, totalLikes, favoriteBlog, mostBlogs, mostLikes }
