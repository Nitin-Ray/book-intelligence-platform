
import requests
from bs4 import BeautifulSoup
import time
import logging

logger = logging.getLogger(__name__)

BASE_URL = "https://books.toscrape.com"


RATING_MAP = {
    "One": 1, "Two": 2, "Three": 3, "Four": 4, "Five": 5
}


def scrape_books(max_pages: int = 5) -> list[dict]:
    """
    Scrape books from books.toscrape.com.
    Returns list of book dicts ready to be saved to DB.
    """
    all_books = []
    page = 1

    while page <= max_pages:
        url = f"{BASE_URL}/catalogue/page-{page}.html"
        logger.info(f"Scraping page {page}: {url}")

        try:
            response = requests.get(url, timeout=10)
            if response.status_code != 200:
                logger.warning(f"Got status {response.status_code} on page {page}, stopping.")
                break
        except requests.RequestException as e:
            logger.error(f"Request failed: {e}")
            break

        soup = BeautifulSoup(response.text, 'html.parser')
        book_cards = soup.select('article.product_pod')

        for card in book_cards:
            try:
              
                title = card.select_one('h3 a')['title']
                rating_word = card.select_one('p.star-rating')['class'][1]
                rating = RATING_MAP.get(rating_word, 0)
                price = card.select_one('p.price_color').text.strip()

               
                relative_href = card.select_one('h3 a')['href']
              
                clean_path = relative_href.replace('../', '')
                book_url = f"{BASE_URL}/catalogue/{clean_path}"

               
                detail = _scrape_detail_page(book_url)

                all_books.append({
                    'title': title,
                    'rating': float(rating),
                    'price': price,
                    'book_url': book_url,
                    **detail
                })

                time.sleep(0.2)  # polite delay

            except Exception as e:
                logger.error(f"Error parsing book card: {e}")
                continue

        page += 1

    logger.info(f"Scraping complete. Total books: {len(all_books)}")
    return all_books


def _scrape_detail_page(url: str) -> dict:
    """
    Scrape a single book's detail page for description, genre, cover image.
    """
    result = {
        'author': 'Unknown',
        'description': '',
        'genre': '',
        'cover_image_url': '',
        'reviews_count': 0,
    }

    try:
        response = requests.get(url, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')

      
        desc_header = soup.find('div', id='product_description')
        if desc_header:
            desc_p = desc_header.find_next_sibling('p')
            if desc_p:
                result['description'] = desc_p.text.strip()

        
        breadcrumbs = soup.select('ul.breadcrumb li')
        if len(breadcrumbs) >= 3:
            result['genre'] = breadcrumbs[2].text.strip()

        
        img_tag = soup.select_one('div.item.active img')
        if img_tag:
            img_src = img_tag['src'].replace('../../', '')
            result['cover_image_url'] = f"https://books.toscrape.com/{img_src}"

      
        table = soup.select('table.table-striped tr')
        for row in table:
            header = row.find('th')
            value = row.find('td')
            if header and value and 'Number of reviews' in header.text:
                try:
                    result['reviews_count'] = int(value.text.strip())
                except ValueError:
                    pass

    except Exception as e:
        logger.error(f"Error scraping detail page {url}: {e}")

    return result
