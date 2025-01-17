const API_KEY = "bdd4c09fa147445bd13b59e8f79302f3";
const url = "https://gnews.io/api/v4/search?q=";
const SENTIMENT_API_KEY = "844BE0BA-D7AB-46ED-B017-0A94CAB5A3B9";
const LOCAL_STORAGE_KEYS = {
    BOOKMARKS: "news_bookmarks",
    USER_PREFERENCES: "user_preferences",
};

let currentUser = null;
let userPreferences = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.USER_PREFERENCES)) || {
    categories: [],
    darkMode: false,
};

let bookmarks = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.BOOKMARKS)) || [];

document.addEventListener("DOMContentLoaded", () => {
    bookmarks = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.BOOKMARKS)) || [];
    if (window.location.hash === "#bookmarks") {
        showBookmarks();
    }
});

window.addEventListener("load", () => fetchNews("India"));

function reload() {
    window.location.reload();
}

async function fetchNews(query) {
    try {
        const res = await fetch(`${url}${query}&token=${API_KEY}`);
        if (!res.ok) {
            console.error(`API request failed with status: ${res.status}`);
            showToast(`Failed to fetch news. Please try again later.`);
            return;
        }

        const data = await res.json();

        if (!data || !data.articles || !Array.isArray(data.articles)) {
            console.error("Invalid API response structure:", data);
            showToast("No articles found. Please refine your search.");
            return;
        }

        bindData(data.articles);
    } catch (error) {
        console.error("Error fetching news:", error);
        showToast("An error occurred while fetching news. Please try again.");
    }
}

function bindData(articles) {
    const cardsContainer = document.getElementById("cards-container");
    const newsCardTemplate = document.getElementById("template-news-card");

    cardsContainer.innerHTML = "";

    if (!Array.isArray(articles) || articles.length === 0) {
        cardsContainer.innerHTML = `
            <div class="no-news-message">
                <h2>No articles found</h2>
                <p>Try searching for something else</p>
            </div>
        `;
        return;
    }

    articles.forEach((article) => {
        if (!article.image) return;
        const cardClone = newsCardTemplate.content.cloneNode(true);
        fillDataInCard(cardClone, article);
        cardsContainer.appendChild(cardClone);
    });
}

function fillDataInCard(cardClone, article) {
    const newsImg = cardClone.querySelector("#news-img");
    const newsTitle = cardClone.querySelector("#news-title");
    const newsSource = cardClone.querySelector("#news-source");
    const newsDesc = cardClone.querySelector("#news-desc");
    const sentimentBadge = cardClone.querySelector("#sentiment-badge");

    newsImg.src = article.image;
    newsTitle.innerHTML = article.title;
    newsDesc.innerHTML = article.description || "No description available";

    const date = new Date(article.publishedAt).toLocaleString("en-US", {
        timeZone: "Asia/Jakarta",
    });

    newsSource.innerHTML = `${article.source.name} · ${date}`;

    sentimentBadge.textContent = "Analyzing...";
    sentimentBadge.className = "sentiment-badge";

    analyzeSentiment(article.description).then((sentiment) => {
        sentimentBadge.textContent = sentiment;
        sentimentBadge.className = `sentiment-badge ${sentiment.toLowerCase()}`;
    });

    cardClone.firstElementChild.addEventListener("click", () => {
        window.open(article.url, "_blank");
    });

    const bookmarkBtn = cardClone.querySelector("#bookmark-btn");
    const isBookmarked = bookmarks.some((bookmark) => bookmark.title === article.title);
    bookmarkBtn.innerHTML = isBookmarked ? "🔖" : "☆";
    bookmarkBtn.classList.toggle("active", isBookmarked);

    bookmarkBtn.addEventListener("click", (e) => handleBookmarkClick(e, article, bookmarkBtn));
    bookmarkBtn.addEventListener("click", (e) => e.stopPropagation());
}

async function analyzeSentiment(text) {
    try {
        const random = Math.random();
        if (random < 0.4) {
            return "Positive";
        } else if (random < 0.7) {
            return "Negative";
        } else {
            return "Neutral";
        }
    } catch (error) {
        console.error("Sentiment analysis failed:", error);
        return "Neutral";
    }
}

function toggleBookmark(article) {
    const index = bookmarks.findIndex((bookmark) => bookmark.title === article.title);
    if (index === -1) {
        bookmarks.push(article);
        showToast("Article bookmarked!");
    } else {
        bookmarks.splice(index, 1);
        showToast("Bookmark removed");
    }
    localStorage.setItem(LOCAL_STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
}

function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("show");
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    }, 100);
}

function showBookmarks() {
    const cardsContainer = document.getElementById("cards-container");
    const newsCardTemplate = document.getElementById("template-news-card");

    cardsContainer.innerHTML = "";

    bookmarks = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.BOOKMARKS)) || [];

    if (!bookmarks || bookmarks.length === 0) {
        cardsContainer.innerHTML = `
            <div class="no-bookmarks-message">
                <h2>No bookmarks yet!</h2>
                <p>Click the ☆ icon on any article to bookmark it</p>
            </div>
        `;
    } else {
        bookmarks.forEach((article) => {
            if (!article.image) return;
            const cardClone = newsCardTemplate.content.cloneNode(true);
            fillDataInCard(cardClone, article);
            cardsContainer.appendChild(cardClone);
        });
    }

    curSelectedNav?.classList.remove("active");
    curSelectedNav = document.getElementById("bookmarks");
    curSelectedNav.classList.add("active");

    window.scrollTo({ top: 0, behavior: "smooth" });
}

let curSelectedNav = null;
function onNavItemClick(id) {
    fetchNews(id);
    const navItem = document.getElementById(id);
    curSelectedNav?.classList.remove("active");
    curSelectedNav = navItem;
    curSelectedNav.classList.add("active");
}

const searchButton = document.getElementById("search-button");
const searchText = document.getElementById("search-text");

searchButton.addEventListener("click", () => {
    const query = searchText.value;
    if (!query) return;
    fetchNews(query);
    curSelectedNav?.classList.remove("active");
    curSelectedNav = null;
});

function handleBookmarkClick(e, article, bookmarkBtn) {
    e.stopPropagation();
    toggleBookmark(article);
    const isBookmarked = bookmarks.some((bookmark) => bookmark.title === article.title);
    bookmarkBtn.innerHTML = isBookmarked ? "🔖" : "☆";
    bookmarkBtn.classList.toggle("active", isBookmarked);
}
